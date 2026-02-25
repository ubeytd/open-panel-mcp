import type {
  OpenPanelConfig,
  ExportEventsParams,
  ExportEventsResponse,
  ExportChartParams,
  TrackHandlerPayload,
} from "../types.js";

export class OpenPanelApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string
  ) {
    let message: string;
    switch (status) {
      case 401:
        message = `API error ${status}: Unauthorized. Check your OPENPANEL_CLIENT_ID and OPENPANEL_CLIENT_SECRET environment variables.`;
        break;
      case 403:
        message = `API error ${status}: Forbidden. Your credentials don't have access to this resource.`;
        break;
      case 404:
        message = `API error ${status}: Not found. Check the project ID and endpoint.`;
        break;
      case 429:
        message = `API error ${status}: Rate limited. Wait before making more requests.`;
        break;
      default:
        message = `API error ${status} (${statusText}): ${body}`;
    }
    super(message);
    this.name = "OpenPanelApiError";
  }
}

export class OpenPanelClient {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: OpenPanelConfig) {
    this.apiUrl = config.apiUrl.replace(/\/+$/, "");
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "openpanel-client-id": this.clientId,
      "openpanel-client-secret": this.clientSecret,
    };
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: this.headers(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      throw new OpenPanelApiError(response.status, response.statusText, text);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  private buildUrl(path: string, params: Record<string, unknown>): string {
    const url = new URL(`${this.apiUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, String(v));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async requestWithParams<T>(
    path: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new OpenPanelApiError(response.status, response.statusText, text);
    }

    return response.json() as Promise<T>;
  }

  async healthCheck(): Promise<unknown> {
    // Try /healthcheck first (self-hosted), fall back to /healthz/ready (cloud)
    try {
      return await this.request("GET", "/healthcheck");
    } catch (error) {
      if (error instanceof OpenPanelApiError && error.status === 404) {
        return this.request("GET", "/healthz/ready");
      }
      throw error;
    }
  }

  async track(payload: TrackHandlerPayload): Promise<void> {
    await this.request("POST", "/track", payload);
  }

  async getEvents(params: ExportEventsParams): Promise<ExportEventsResponse> {
    return this.requestWithParams("/export/events", {
      projectId: params.projectId,
      event: params.event,
      profileId: params.profileId,
      start: params.start,
      end: params.end,
      page: params.page,
      limit: params.limit,
    });
  }

  async getChart(params: ExportChartParams): Promise<unknown> {
    const queryParams: Record<string, unknown> = {
      projectId: params.projectId,
      range: params.range,
      interval: params.interval,
      startDate: params.startDate,
      endDate: params.endDate,
      previous: params.previous,
    };

    // Events and breakdowns must be JSON-encoded in the query string
    if (params.series) {
      queryParams.events = JSON.stringify(params.series);
    }

    if (params.breakdowns) {
      queryParams.breakdowns = JSON.stringify(params.breakdowns);
    }

    return this.requestWithParams("/export/charts", queryParams);
  }
}

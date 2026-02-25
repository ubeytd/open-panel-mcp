export interface OpenPanelConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface ExportEventsParams {
  projectId?: string;
  event?: string | string[];
  profileId?: string;
  start?: string;
  end?: string;
  page?: number;
  limit?: number;
}

export interface ExportEventsResponse {
  meta: {
    count: number;
    totalCount: number;
    pages: number;
    current: number;
  };
  data: ExportEvent[];
}

export interface ExportEvent {
  id: string;
  name: string;
  profileId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  createdAt: string;
  country?: string;
  city?: string;
  os?: string;
  browser?: string;
  device?: string;
  brand?: string;
  model?: string;
  duration?: number;
  path?: string;
  referrer?: string;
  referrerName?: string;
  referrerType?: string;
}

export interface ChartSeriesItem {
  name: string;
  segment?: string;
  filters?: Array<{
    name: string;
    operator: string;
    value: string[];
  }>;
}

export interface ChartBreakdown {
  name: string;
}

export interface ExportChartParams {
  projectId?: string;
  series?: ChartSeriesItem[];
  breakdowns?: ChartBreakdown[];
  interval?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  previous?: boolean;
}

export interface TrackEventPayload {
  type: "track";
  payload: {
    name: string;
    profileId?: string;
    properties?: Record<string, unknown>;
  };
}

export interface IdentifyPayload {
  type: "identify";
  payload: {
    profileId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
    properties?: Record<string, unknown>;
  };
}

export interface IncrementPayload {
  type: "increment";
  payload: {
    profileId: string;
    property: string;
    value?: number;
  };
}

export interface DecrementPayload {
  type: "decrement";
  payload: {
    profileId: string;
    property: string;
    value?: number;
  };
}

export interface AliasPayload {
  type: "alias";
  payload: {
    profileId: string;
    alias: string;
  };
}

export type TrackHandlerPayload =
  | TrackEventPayload
  | IdentifyPayload
  | IncrementPayload
  | DecrementPayload
  | AliasPayload;

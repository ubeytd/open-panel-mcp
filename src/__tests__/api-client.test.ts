import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenPanelClient } from "../services/api-client.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockOkResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function mockEmptyOkResponse() {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(""),
  };
}

function mockErrorResponse(status: number, statusText: string, body: string) {
  return {
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(body),
  };
}

describe("OpenPanelClient", () => {
  let client: OpenPanelClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OpenPanelClient({
      apiUrl: "https://api.example.com",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    });
  });

  describe("constructor", () => {
    it("should strip trailing slash from apiUrl", () => {
      const c = new OpenPanelClient({
        apiUrl: "https://api.example.com/",
        clientId: "id",
        clientSecret: "secret",
      });
      mockFetch.mockResolvedValueOnce(mockOkResponse({ status: "ok" }));
      c.healthCheck();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/healthcheck",
        expect.any(Object)
      );
    });
  });

  describe("healthCheck", () => {
    it("should try /healthcheck first", async () => {
      mockFetch.mockResolvedValueOnce(mockOkResponse({ redis: { ok: true } }));

      const result = await client.healthCheck();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/healthcheck",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "openpanel-client-id": "test-client-id",
            "openpanel-client-secret": "test-client-secret",
          }),
        })
      );
      expect(result).toEqual({ redis: { ok: true } });
    });

    it("should fall back to /healthz/ready if /healthcheck returns 404", async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(404, "Not Found", "Not found"));
      mockFetch.mockResolvedValueOnce(mockOkResponse({ ready: true }));

      const result = await client.healthCheck();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ ready: true });
    });

    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(500, "Internal Server Error", "server down"));

      await expect(client.healthCheck()).rejects.toThrow();
    });
  });

  describe("track", () => {
    it("should POST to /track with correct payload", async () => {
      mockFetch.mockResolvedValueOnce(mockEmptyOkResponse());

      await client.track({
        type: "track",
        payload: {
          name: "button_click",
          profileId: "user-123",
          properties: { page: "/home" },
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/track",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "openpanel-client-id": "test-client-id",
            "openpanel-client-secret": "test-client-secret",
          }),
          body: JSON.stringify({
            type: "track",
            payload: {
              name: "button_click",
              profileId: "user-123",
              properties: { page: "/home" },
            },
          }),
        })
      );
    });

    it("should send identify payload", async () => {
      mockFetch.mockResolvedValueOnce(mockEmptyOkResponse());

      await client.track({
        type: "identify",
        payload: {
          profileId: "user-123",
          firstName: "John",
          email: "john@example.com",
        },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe("identify");
      expect(body.payload.profileId).toBe("user-123");
      expect(body.payload.firstName).toBe("John");
    });
  });

  describe("getEvents", () => {
    it("should GET /export/events with query params", async () => {
      const mockResponse = {
        meta: { count: 2, totalCount: 100, pages: 50, current: 1 },
        data: [
          { id: "ev1", name: "page_view", properties: {}, createdAt: "2025-01-01" },
          { id: "ev2", name: "click", properties: {}, createdAt: "2025-01-01" },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getEvents({
        projectId: "proj-1",
        event: "page_view",
        limit: 10,
        page: 1,
      });

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.pathname).toBe("/export/events");
      expect(url.searchParams.get("projectId")).toBe("proj-1");
      expect(url.searchParams.get("event")).toBe("page_view");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(result.data).toHaveLength(2);
    });

    it("should handle array event filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ meta: {}, data: [] }),
      });

      await client.getEvents({
        projectId: "proj-1",
        event: ["page_view", "click"],
      });

      const url = new URL(mockFetch.mock.calls[0][0]);
      const events = url.searchParams.getAll("event");
      expect(events).toEqual(["page_view", "click"]);
    });
  });

  describe("getChart", () => {
    it("should GET /export/charts with JSON-encoded events", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ series: [] }),
      });

      await client.getChart({
        projectId: "proj-1",
        series: [{ name: "page_view" }],
        range: "30d",
        interval: "day",
      });

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.pathname).toBe("/export/charts");
      expect(url.searchParams.get("projectId")).toBe("proj-1");
      expect(url.searchParams.get("range")).toBe("30d");
      expect(url.searchParams.get("interval")).toBe("day");
      expect(JSON.parse(url.searchParams.get("events")!)).toEqual([{ name: "page_view" }]);
    });
  });

  describe("error handling", () => {
    it("should provide actionable 401 error", async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(401, "Unauthorized", "Invalid credentials"));

      await expect(client.healthCheck()).rejects.toThrow(
        /401.*check.*OPENPANEL_CLIENT_ID.*OPENPANEL_CLIENT_SECRET/i
      );
    });

    it("should throw if both health endpoints return non-404 error", async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(500, "Internal Server Error", "server error"));

      await expect(client.healthCheck()).rejects.toThrow(/500/);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(client.healthCheck()).rejects.toThrow(/ECONNREFUSED/);
    });
  });
});

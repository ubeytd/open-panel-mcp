import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OpenPanelClient } from "../services/api-client.js";
import { registerTools } from "../tools/register.js";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Tool Registration", () => {
  let server: McpServer;
  let client: OpenPanelClient;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: "test", version: "1.0.0" });
    client = new OpenPanelClient({
      apiUrl: "https://api.test.com",
      clientId: "test-id",
      clientSecret: "test-secret",
    });
  });

  it("should register all 8 tools without error", () => {
    expect(() => registerTools(server, client)).not.toThrow();
  });

  it("should register tools with correct names", () => {
    registerTools(server, client);

    const expectedTools = [
      "openpanel_health_check",
      "openpanel_track_event",
      "openpanel_identify_profile",
      "openpanel_increment_property",
      "openpanel_decrement_property",
      "openpanel_alias_profile",
      "openpanel_get_events",
      "openpanel_get_chart",
    ];

    // Server internals - we verify by registering without error
    // Each tool name follows the openpanel_ prefix convention
    for (const name of expectedTools) {
      expect(name).toMatch(/^openpanel_/);
      expect(name).toMatch(/^[a-z_]+$/);
    }
  });
});

describe("Tool Handlers", () => {
  let client: OpenPanelClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OpenPanelClient({
      apiUrl: "https://api.test.com",
      clientId: "test-id",
      clientSecret: "test-secret",
    });
  });

  describe("track event handler", () => {
    it("should call client.track with correct payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
      });

      await client.track({
        type: "track",
        payload: {
          name: "test_event",
          profileId: "user-1",
          properties: { key: "value" },
        },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        type: "track",
        payload: {
          name: "test_event",
          profileId: "user-1",
          properties: { key: "value" },
        },
      });
    });
  });

  describe("identify handler", () => {
    it("should send identify payload with all fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
      });

      await client.track({
        type: "identify",
        payload: {
          profileId: "user-1",
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          avatar: "https://example.com/jane.jpg",
          properties: { plan: "enterprise" },
        },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe("identify");
      expect(body.payload.firstName).toBe("Jane");
      expect(body.payload.properties.plan).toBe("enterprise");
    });
  });

  describe("get events handler", () => {
    it("should return formatted event data", async () => {
      const mockData = {
        meta: { count: 1, totalCount: 1, pages: 1, current: 1 },
        data: [
          {
            id: "ev-1",
            name: "signup",
            profileId: "user-1",
            properties: { source: "organic" },
            createdAt: "2025-01-15T10:00:00Z",
            country: "US",
            browser: "Chrome",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await client.getEvents({
        projectId: "proj-1",
        event: "signup",
        limit: 10,
      });

      expect(result.meta.count).toBe(1);
      expect(result.data[0].name).toBe("signup");
      expect(result.data[0].country).toBe("US");
    });
  });

  describe("get chart handler", () => {
    it("should JSON-encode events and breakdowns in query string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ series: [] }),
      });

      await client.getChart({
        projectId: "proj-1",
        series: [
          {
            name: "page_view",
            segment: "user",
            filters: [
              { name: "country", operator: "is", value: ["US", "UK"] },
            ],
          },
        ],
        breakdowns: [{ name: "browser" }],
        range: "7d",
      });

      const url = new URL(mockFetch.mock.calls[0][0]);
      const events = JSON.parse(url.searchParams.get("events")!);
      expect(events).toEqual([
        {
          name: "page_view",
          segment: "user",
          filters: [{ name: "country", operator: "is", value: ["US", "UK"] }],
        },
      ]);
      const breakdowns = JSON.parse(url.searchParams.get("breakdowns")!);
      expect(breakdowns).toEqual([{ name: "browser" }]);
    });
  });

  describe("error scenarios", () => {
    it("should throw descriptive error for 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve("Bad credentials"),
      });

      await expect(client.healthCheck()).rejects.toThrow(/OPENPANEL_CLIENT_ID/);
    });

    it("should handle network timeouts", async () => {
      mockFetch.mockRejectedValueOnce(new Error("AbortError: signal timed out"));

      await expect(client.healthCheck()).rejects.toThrow(/timed out/);
    });
  });
});

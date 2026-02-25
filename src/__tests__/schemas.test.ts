import { describe, it, expect } from "vitest";
import {
  TrackEventSchema,
  IdentifyProfileSchema,
  IncrementPropertySchema,
  DecrementPropertySchema,
  AliasProfileSchema,
  GetEventsSchema,
  GetChartSchema,
} from "../schemas/index.js";

describe("TrackEventSchema", () => {
  it("should accept valid event", () => {
    const result = TrackEventSchema.safeParse({
      name: "button_click",
      project_id: "proj-1",
    });
    expect(result.success).toBe(true);
  });

  it("should accept event with properties and profileId", () => {
    const result = TrackEventSchema.safeParse({
      name: "purchase",
      project_id: "proj-1",
      profile_id: "user-123",
      properties: { amount: 99.99, currency: "USD" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = TrackEventSchema.safeParse({
      name: "",
      project_id: "proj-1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing project_id", () => {
    const result = TrackEventSchema.safeParse({
      name: "click",
    });
    expect(result.success).toBe(false);
  });
});

describe("IdentifyProfileSchema", () => {
  it("should accept valid profile", () => {
    const result = IdentifyProfileSchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
    });
    expect(result.success).toBe(true);
  });

  it("should accept profile with all optional fields", () => {
    const result = IdentifyProfileSchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      avatar: "https://example.com/avatar.jpg",
      properties: { plan: "pro" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = IdentifyProfileSchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("IncrementPropertySchema", () => {
  it("should accept valid increment", () => {
    const result = IncrementPropertySchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      property: "login_count",
    });
    expect(result.success).toBe(true);
  });

  it("should accept custom value", () => {
    const result = IncrementPropertySchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      property: "score",
      value: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(10);
    }
  });

  it("should default value to 1", () => {
    const result = IncrementPropertySchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      property: "count",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(1);
    }
  });
});

describe("DecrementPropertySchema", () => {
  it("should accept valid decrement", () => {
    const result = DecrementPropertySchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      property: "credits",
      value: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe("AliasProfileSchema", () => {
  it("should accept valid alias", () => {
    const result = AliasProfileSchema.safeParse({
      profile_id: "user-123",
      project_id: "proj-1",
      alias: "anonymous-456",
    });
    expect(result.success).toBe(true);
  });
});

describe("GetEventsSchema", () => {
  it("should accept minimal params", () => {
    const result = GetEventsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept with project_id", () => {
    const result = GetEventsSchema.safeParse({
      project_id: "proj-1",
    });
    expect(result.success).toBe(true);
  });

  it("should accept full params", () => {
    const result = GetEventsSchema.safeParse({
      project_id: "proj-1",
      event: "page_view",
      profile_id: "user-123",
      start: "2025-01-01",
      end: "2025-01-31",
      page: 2,
      limit: 25,
    });
    expect(result.success).toBe(true);
  });

  it("should accept array of events", () => {
    const result = GetEventsSchema.safeParse({
      project_id: "proj-1",
      event: ["page_view", "click"],
    });
    expect(result.success).toBe(true);
  });

  it("should enforce limit max of 200", () => {
    const result = GetEventsSchema.safeParse({
      project_id: "proj-1",
      limit: 500,
    });
    expect(result.success).toBe(false);
  });

  it("should default limit to 50", () => {
    const result = GetEventsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });
});

describe("GetChartSchema", () => {
  it("should accept minimal params", () => {
    const result = GetChartSchema.safeParse({
      project_id: "proj-1",
      events: [{ name: "page_view" }],
    });
    expect(result.success).toBe(true);
  });

  it("should accept full chart query", () => {
    const result = GetChartSchema.safeParse({
      project_id: "proj-1",
      events: [
        {
          name: "page_view",
          segment: "user",
          filters: [
            { name: "country", operator: "is", value: ["US"] },
          ],
        },
      ],
      breakdowns: [{ name: "browser" }],
      interval: "day",
      range: "30d",
      previous: true,
    });
    expect(result.success).toBe(true);
  });

  it("should default range to 30d", () => {
    const result = GetChartSchema.safeParse({
      project_id: "proj-1",
      events: [{ name: "page_view" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.range).toBe("30d");
    }
  });

  it("should validate interval enum", () => {
    const result = GetChartSchema.safeParse({
      project_id: "proj-1",
      events: [{ name: "page_view" }],
      interval: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

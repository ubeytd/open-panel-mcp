import { z } from "zod";

// ── Tracking Schemas ──

export const TrackEventSchema = z.object({
  name: z.string()
    .min(1, "Event name is required")
    .describe("Event name (e.g. 'button_click', 'page_view', 'purchase')"),
  project_id: z.string()
    .min(1, "Project ID is required")
    .describe("OpenPanel project ID"),
  profile_id: z.string()
    .optional()
    .describe("User profile ID to associate this event with"),
  properties: z.record(z.string(), z.unknown())
    .optional()
    .describe("Custom event properties as key-value pairs"),
}).strict();

export const IdentifyProfileSchema = z.object({
  profile_id: z.string()
    .min(1, "Profile ID is required")
    .describe("Unique user profile ID"),
  project_id: z.string()
    .min(1, "Project ID is required")
    .describe("OpenPanel project ID"),
  first_name: z.string()
    .optional()
    .describe("User's first name"),
  last_name: z.string()
    .optional()
    .describe("User's last name"),
  email: z.string()
    .email("Invalid email format")
    .optional()
    .describe("User's email address"),
  avatar: z.string()
    .url("Invalid avatar URL")
    .optional()
    .describe("URL to user's avatar image"),
  properties: z.record(z.string(), z.unknown())
    .optional()
    .describe("Custom profile properties as key-value pairs"),
}).strict();

export const IncrementPropertySchema = z.object({
  profile_id: z.string()
    .min(1, "Profile ID is required")
    .describe("User profile ID"),
  project_id: z.string()
    .min(1, "Project ID is required")
    .describe("OpenPanel project ID"),
  property: z.string()
    .min(1, "Property name is required")
    .describe("Name of the numeric property to increment"),
  value: z.number()
    .int()
    .positive()
    .default(1)
    .describe("Amount to increment by (default: 1)"),
}).strict();

export const DecrementPropertySchema = z.object({
  profile_id: z.string()
    .min(1, "Profile ID is required")
    .describe("User profile ID"),
  project_id: z.string()
    .min(1, "Project ID is required")
    .describe("OpenPanel project ID"),
  property: z.string()
    .min(1, "Property name is required")
    .describe("Name of the numeric property to decrement"),
  value: z.number()
    .int()
    .positive()
    .default(1)
    .describe("Amount to decrement by (default: 1)"),
}).strict();

export const AliasProfileSchema = z.object({
  profile_id: z.string()
    .min(1, "Profile ID is required")
    .describe("The primary profile ID"),
  project_id: z.string()
    .min(1, "Project ID is required")
    .describe("OpenPanel project ID"),
  alias: z.string()
    .min(1, "Alias is required")
    .describe("The alias profile ID to link to the primary profile"),
}).strict();

// ── Export / Query Schemas ──

export const GetEventsSchema = z.object({
  project_id: z.string()
    .optional()
    .describe("OpenPanel project ID. Optional — if omitted, uses the project linked to your client credentials."),
  event: z.union([
    z.string(),
    z.array(z.string()),
  ])
    .optional()
    .describe("Event name(s) to filter by. String or array of strings."),
  profile_id: z.string()
    .optional()
    .describe("Filter events by a specific user profile ID"),
  start: z.string()
    .optional()
    .describe("Start date in ISO format (e.g. '2025-01-01')"),
  end: z.string()
    .optional()
    .describe("End date in ISO format (e.g. '2025-01-31')"),
  page: z.number()
    .int()
    .min(1)
    .default(1)
    .describe("Page number for pagination (default: 1)"),
  limit: z.number()
    .int()
    .min(1)
    .max(200, "Maximum 200 events per page")
    .default(50)
    .describe("Number of events per page (default: 50, max: 200)"),
}).strict();

const ChartEventFilterSchema = z.object({
  name: z.string()
    .describe("Property name to filter on (e.g. 'country', 'browser')"),
  operator: z.enum(["is", "isNot", "contains", "doesNotContain", "gt", "gte", "lt", "lte", "regex"])
    .describe("Filter operator"),
  value: z.array(z.string())
    .describe("Filter values"),
}).strict();

const ChartEventSchema = z.object({
  name: z.string()
    .describe("Event name to include in chart"),
  segment: z.enum(["event", "user", "session", "property_sum", "property_average"])
    .optional()
    .describe("How to segment the event data"),
  filters: z.array(ChartEventFilterSchema)
    .optional()
    .describe("Filters to apply to this event"),
}).strict();

const ChartBreakdownSchema = z.object({
  name: z.string()
    .describe("Property name to break down by (e.g. 'browser', 'country', 'os')"),
}).strict();

export const GetChartSchema = z.object({
  project_id: z.string()
    .optional()
    .describe("OpenPanel project ID. Optional — if omitted, uses the project linked to your client credentials."),
  events: z.array(ChartEventSchema)
    .min(1, "At least one event is required")
    .describe("Events to include in the chart"),
  breakdowns: z.array(ChartBreakdownSchema)
    .optional()
    .describe("Dimensions to break down the data by"),
  interval: z.enum(["minute", "hour", "day", "week", "month"])
    .optional()
    .default("day")
    .describe("Time interval for data aggregation (default: 'day')"),
  range: z.string()
    .optional()
    .default("30d")
    .describe("Time range (e.g. '7d', '30d', '90d', '1y'). Default: '30d'"),
  start_date: z.string()
    .optional()
    .describe("Custom start date (ISO format). Overrides range."),
  end_date: z.string()
    .optional()
    .describe("Custom end date (ISO format). Overrides range."),
  previous: z.boolean()
    .optional()
    .default(false)
    .describe("Include previous period for comparison (default: false)"),
}).strict();

// ── Type Exports ──

export type TrackEventInput = z.infer<typeof TrackEventSchema>;
export type IdentifyProfileInput = z.infer<typeof IdentifyProfileSchema>;
export type IncrementPropertyInput = z.infer<typeof IncrementPropertySchema>;
export type DecrementPropertyInput = z.infer<typeof DecrementPropertySchema>;
export type AliasProfileInput = z.infer<typeof AliasProfileSchema>;
export type GetEventsInput = z.infer<typeof GetEventsSchema>;
export type GetChartInput = z.infer<typeof GetChartSchema>;

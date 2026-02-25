import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OpenPanelClient } from "../services/api-client.js";
import {
  TrackEventSchema,
  IdentifyProfileSchema,
  IncrementPropertySchema,
  DecrementPropertySchema,
  AliasProfileSchema,
  GetEventsSchema,
  GetChartSchema,
} from "../schemas/index.js";
import type {
  TrackEventInput,
  IdentifyProfileInput,
  IncrementPropertyInput,
  DecrementPropertyInput,
  AliasProfileInput,
  GetEventsInput,
  GetChartInput,
} from "../schemas/index.js";
import { CHARACTER_LIMIT } from "../constants.js";

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function truncateIfNeeded(text: string): string {
  if (text.length > CHARACTER_LIMIT) {
    return (
      text.slice(0, CHARACTER_LIMIT) +
      "\n\n--- Response truncated. Use filters, pagination, or a smaller date range to reduce results. ---"
    );
  }
  return text;
}

export function registerTools(server: McpServer, client: OpenPanelClient): void {
  // ── Health Check ──
  server.registerTool(
    "openpanel_health_check",
    {
      title: "Check OpenPanel Health",
      description: `Check if the OpenPanel instance is healthy and responding.

Returns: { "status": "ok" } if the instance is running.

Use this to verify connectivity before running other tools.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const result = await client.healthCheck();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Health check failed: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Track Event ──
  server.registerTool(
    "openpanel_track_event",
    {
      title: "Track Event",
      description: `Track a custom analytics event in OpenPanel.

Args:
  - name (string, required): Event name (e.g. 'button_click', 'purchase', 'signup')
  - project_id (string, required): OpenPanel project ID
  - profile_id (string, optional): User profile ID to associate this event with
  - properties (object, optional): Custom key-value properties for the event

Returns: Confirmation that the event was accepted (202 Accepted).

Example: Track a purchase event with amount and currency properties.`,
      inputSchema: TrackEventSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: TrackEventInput) => {
      try {
        await client.track({
          type: "track",
          payload: {
            name: params.name,
            profileId: params.profile_id,
            properties: params.properties,
          },
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Event '${params.name}' tracked successfully for project '${params.project_id}'.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to track event: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Identify Profile ──
  server.registerTool(
    "openpanel_identify_profile",
    {
      title: "Identify User Profile",
      description: `Create or update a user profile in OpenPanel.

Args:
  - profile_id (string, required): Unique user identifier
  - project_id (string, required): OpenPanel project ID
  - first_name (string, optional): User's first name
  - last_name (string, optional): User's last name
  - email (string, optional): User's email address
  - avatar (string, optional): URL to user's avatar image
  - properties (object, optional): Custom profile properties

Returns: Confirmation that the profile was updated.`,
      inputSchema: IdentifyProfileSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: IdentifyProfileInput) => {
      try {
        await client.track({
          type: "identify",
          payload: {
            profileId: params.profile_id,
            firstName: params.first_name,
            lastName: params.last_name,
            email: params.email,
            avatar: params.avatar,
            properties: params.properties,
          },
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Profile '${params.profile_id}' identified successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to identify profile: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Increment Property ──
  server.registerTool(
    "openpanel_increment_property",
    {
      title: "Increment Profile Property",
      description: `Increment a numeric property on a user profile.

Args:
  - profile_id (string, required): User profile ID
  - project_id (string, required): OpenPanel project ID
  - property (string, required): Property name to increment (e.g. 'login_count')
  - value (number, optional): Amount to increment by (default: 1)

Returns: Confirmation that the property was incremented.`,
      inputSchema: IncrementPropertySchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: IncrementPropertyInput) => {
      try {
        await client.track({
          type: "increment",
          payload: {
            profileId: params.profile_id,
            property: params.property,
            value: params.value,
          },
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Property '${params.property}' incremented by ${params.value} for profile '${params.profile_id}'.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to increment property: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Decrement Property ──
  server.registerTool(
    "openpanel_decrement_property",
    {
      title: "Decrement Profile Property",
      description: `Decrement a numeric property on a user profile.

Args:
  - profile_id (string, required): User profile ID
  - project_id (string, required): OpenPanel project ID
  - property (string, required): Property name to decrement (e.g. 'credits')
  - value (number, optional): Amount to decrement by (default: 1)

Returns: Confirmation that the property was decremented.`,
      inputSchema: DecrementPropertySchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: DecrementPropertyInput) => {
      try {
        await client.track({
          type: "decrement",
          payload: {
            profileId: params.profile_id,
            property: params.property,
            value: params.value,
          },
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Property '${params.property}' decremented by ${params.value} for profile '${params.profile_id}'.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to decrement property: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Alias Profile ──
  server.registerTool(
    "openpanel_alias_profile",
    {
      title: "Alias Profile",
      description: `Link two profile IDs together. Useful for merging anonymous and authenticated profiles.

Args:
  - profile_id (string, required): The primary profile ID
  - project_id (string, required): OpenPanel project ID
  - alias (string, required): The alias profile ID to link (e.g. anonymous session ID)

Returns: Confirmation that the profiles were linked.

Example: Link an anonymous session to a logged-in user.`,
      inputSchema: AliasProfileSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: AliasProfileInput) => {
      try {
        await client.track({
          type: "alias",
          payload: {
            profileId: params.profile_id,
            alias: params.alias,
          },
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Profile '${params.alias}' aliased to '${params.profile_id}' successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to alias profile: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Get Events ──
  server.registerTool(
    "openpanel_get_events",
    {
      title: "Get Events",
      description: `Query tracked events from OpenPanel with filtering and pagination.

Args:
  - project_id (string, optional): OpenPanel project ID. If omitted, uses the project linked to your client credentials.
  - event (string | string[], optional): Event name(s) to filter by
  - profile_id (string, optional): Filter events by user profile ID
  - start (string, optional): Start date in ISO format (e.g. '2025-01-01')
  - end (string, optional): End date in ISO format (e.g. '2025-01-31')
  - page (number, optional): Page number (default: 1)
  - limit (number, optional): Events per page (default: 50, max: 200)

Returns JSON:
  {
    "meta": { "count": number, "totalCount": number, "pages": number, "current": number },
    "data": [{ "id", "name", "profileId", "properties", "createdAt", "country", "browser", ... }]
  }

Use 'page' to paginate through large result sets.`,
      inputSchema: GetEventsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetEventsInput) => {
      try {
        const result = await client.getEvents({
          projectId: params.project_id,
          event: params.event,
          profileId: params.profile_id,
          start: params.start,
          end: params.end,
          page: params.page,
          limit: params.limit,
        });

        const text = truncateIfNeeded(JSON.stringify(result, null, 2));
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to get events: ${formatError(error)}` }],
        };
      }
    }
  );

  // ── Get Chart Data ──
  server.registerTool(
    "openpanel_get_chart",
    {
      title: "Get Chart / Analytics Data",
      description: `Query aggregated analytics data from OpenPanel. Use this for metrics, trends, and breakdowns.

Args:
  - project_id (string, optional): OpenPanel project ID. If omitted, uses the project linked to your client credentials.
  - events (array, required): Events to analyze. Each: { name, segment?, filters? }
    - name (string): Event name (e.g. 'page_view', 'purchase')
    - segment (string, optional): 'event' | 'user' | 'session' | 'property_sum' | 'property_average'
    - filters (array, optional): [{ name, operator, value[] }]
      - operator: 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'gt' | 'gte' | 'lt' | 'lte' | 'regex'
  - breakdowns (array, optional): [{ name }] - Properties to break down by (e.g. 'browser', 'country')
  - interval (string, optional): 'minute' | 'hour' | 'day' | 'week' | 'month' (default: 'day')
  - range (string, optional): Time range, e.g. '7d', '30d', '90d', '1y' (default: '30d')
  - start_date (string, optional): Custom start date (ISO). Overrides range.
  - end_date (string, optional): Custom end date (ISO). Overrides range.
  - previous (boolean, optional): Include previous period comparison (default: false)

Returns: Chart data with time series, aggregated values, and breakdowns.

Examples:
  - Page views last 7 days: events=[{name:"page_view"}], range="7d"
  - Signups by country: events=[{name:"signup"}], breakdowns=[{name:"country"}]
  - Unique users per week: events=[{name:"session_start", segment:"user"}], interval="week"`,
      inputSchema: GetChartSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetChartInput) => {
      try {
        const result = await client.getChart({
          projectId: params.project_id,
          series: params.events.map((e) => ({
            name: e.name,
            segment: e.segment,
            filters: e.filters,
          })),
          breakdowns: params.breakdowns,
          interval: params.interval,
          range: params.range,
          startDate: params.start_date,
          endDate: params.end_date,
          previous: params.previous,
        });

        const text = truncateIfNeeded(JSON.stringify(result, null, 2));
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to get chart data: ${formatError(error)}` }],
        };
      }
    }
  );
}

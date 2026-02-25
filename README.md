# openpanel-mcp-server

[![npm version](https://img.shields.io/npm/v/openpanel-mcp-server.svg)](https://www.npmjs.com/package/openpanel-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for [OpenPanel](https://openpanel.dev) — the open-source analytics platform. Enables LLMs to track events, manage user profiles, and query analytics data.

Works with **self-hosted** and **cloud** OpenPanel instances.

## Quick Start

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openpanel": {
      "command": "npx",
      "args": ["-y", "openpanel-mcp-server"],
      "env": {
        "OPENPANEL_CLIENT_ID": "your-client-id",
        "OPENPANEL_CLIENT_SECRET": "your-client-secret",
        "OPENPANEL_API_URL": "https://your-domain.com/api"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add openpanel \
  -e OPENPANEL_CLIENT_ID=your-client-id \
  -e OPENPANEL_CLIENT_SECRET=your-client-secret \
  -e OPENPANEL_API_URL=https://your-domain.com/api \
  -- npx -y openpanel-mcp-server
```

### Other MCP Clients

```bash
npx openpanel-mcp-server
```

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `OPENPANEL_CLIENT_ID` | Yes | — | Client ID from your OpenPanel project |
| `OPENPANEL_CLIENT_SECRET` | Yes | — | Client secret from your OpenPanel project |
| `OPENPANEL_API_URL` | No | `https://api.openpanel.dev` | API URL (set for self-hosted instances) |

Get credentials from your OpenPanel dashboard: **Settings → Projects → Select project → Create client (Root type)**.

## Tools

### Write Operations

| Tool | Description |
|------|-------------|
| `openpanel_track_event` | Track a custom analytics event with properties |
| `openpanel_identify_profile` | Create or update a user profile |
| `openpanel_increment_property` | Increment a numeric profile property |
| `openpanel_decrement_property` | Decrement a numeric profile property |
| `openpanel_alias_profile` | Link two profile IDs (e.g. anonymous → authenticated) |

### Read Operations

| Tool | Description |
|------|-------------|
| `openpanel_get_events` | Query events with filters, date ranges, and pagination |
| `openpanel_get_chart` | Aggregated analytics: metrics, trends, breakdowns, comparisons |
| `openpanel_health_check` | Verify OpenPanel instance connectivity |

## Usage Examples

**Track events:**
> "Track a purchase event for user-123 with amount 99.99 and currency USD"

**Query analytics:**
> "Show me page views for the last 7 days broken down by country"

**Get raw events:**
> "Get the last 20 signup events from this month"

**Chart with filters:**
> "Compare screen_view counts this week vs last week, broken down by browser"

## Development

```bash
git clone https://github.com/ubeytdemir/openpanel-mcp-server.git
cd openpanel-mcp-server
npm install
npm test        # 42 tests
npm run build   # compile TypeScript
npm run dev     # watch mode
```

## Architecture

```
src/
├── index.ts              # Entry point (stdio transport)
├── constants.ts          # Config constants
├── types.ts              # TypeScript interfaces
├── schemas/index.ts      # Zod input validation
├── services/api-client.ts # OpenPanel HTTP client
├── tools/register.ts     # MCP tool definitions
└── __tests__/            # Unit tests
```

- **Transport**: stdio
- **Auth**: `openpanel-client-id` + `openpanel-client-secret` headers
- **API**: OpenPanel public REST API (`/track`, `/export/events`, `/export/charts`, `/healthcheck`)
- **Validation**: Zod schemas with descriptive errors
- **Zero deps**: Uses native `fetch` (Node 18+), no axios/node-fetch

## License

MIT
# open-panel-mcp

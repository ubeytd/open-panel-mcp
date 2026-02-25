#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OpenPanelClient } from "./services/api-client.js";
import { registerTools } from "./tools/register.js";
import { DEFAULT_API_URL } from "./constants.js";

function getConfig() {
  const clientId = process.env.OPENPANEL_CLIENT_ID;
  const clientSecret = process.env.OPENPANEL_CLIENT_SECRET;
  const apiUrl = process.env.OPENPANEL_API_URL || DEFAULT_API_URL;

  if (!clientId || !clientSecret) {
    console.error(
      "ERROR: OPENPANEL_CLIENT_ID and OPENPANEL_CLIENT_SECRET environment variables are required.\n\n" +
        "Get your credentials from your OpenPanel dashboard:\n" +
        "  1. Go to Settings > Projects\n" +
        "  2. Select your project\n" +
        "  3. Copy the Client ID and Client Secret\n\n" +
        "For self-hosted instances, also set OPENPANEL_API_URL (e.g. https://your-domain.com/api)\n"
    );
    process.exit(1);
  }

  return { apiUrl, clientId, clientSecret };
}

async function main() {
  const config = getConfig();

  const client = new OpenPanelClient(config);

  const server = new McpServer({
    name: "openpanel-mcp-server",
    version: "1.0.0",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`OpenPanel MCP server running (API: ${config.apiUrl})`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

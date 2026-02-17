#!/usr/bin/env node

/**
 * Blumira MCP Server — entry point.
 *
 * Boots the MCP server, validates configuration, registers tools,
 * and connects to the stdio transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getSettings, redactToken } from "./config.js";
import { logger, registerSecret, setLogLevel } from "./logger.js";
import { registerTools } from "./tools/register.js";

async function main() {
  // Validate configuration early
  const settings = getSettings();

  // Set up logging
  setLogLevel(settings.logLevel);
  registerSecret(settings.accessToken);

  logger.info("Starting blumira-mcp server", {
    baseUrl: settings.baseUrl,
    token: redactToken(settings.accessToken),
  });

  // Create MCP server
  const server = new McpServer({
    name: "blumira-mcp",
    version: "1.0.0",
  });

  // Register all Blumira tools
  registerTools(server);

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("blumira-mcp server connected and ready");
}

main().catch((err) => {
  logger.error("Fatal error starting blumira-mcp server", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

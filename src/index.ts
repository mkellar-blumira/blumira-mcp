#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BlumiraClient } from "./blumira-client.js";
import type { FindingFilters, PaginationParams } from "./blumira-client.js";

const BLUMIRA_ACCESS_TOKEN = process.env.BLUMIRA_ACCESS_TOKEN;

if (!BLUMIRA_ACCESS_TOKEN) {
  console.error(
    "Error: BLUMIRA_ACCESS_TOKEN environment variable is required."
  );
  console.error(
    "Set it to your Blumira JWT access token before starting the server."
  );
  process.exit(1);
}

const client = new BlumiraClient({ accessToken: BLUMIRA_ACCESS_TOKEN });

const server = new McpServer({
  name: "blumira-mcp",
  version: "1.0.0",
});

// ─── Shared schemas ────────────────────────────────────────────────────────────

const PaginationSchema = {
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Page number (1-based)"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe("Number of items per page (1–200)"),
  order_by: z
    .string()
    .optional()
    .describe("Ordering expression, e.g. 'created;desc' or 'name;asc'"),
};

const FindingFilterSchema = {
  blocked: z.boolean().optional().describe("Filter by blocked status"),
  category: z.number().int().positive().optional().describe("Category ID"),
  created_after: z.string().optional().describe("ISO 8601 timestamp"),
  created_before: z.string().optional().describe("ISO 8601 timestamp"),
  created_by: z.string().optional().describe("UUID of the creator"),
  modified_after: z.string().optional().describe("ISO 8601 timestamp"),
  modified_before: z.string().optional().describe("ISO 8601 timestamp"),
  modified_by: z.string().optional().describe("UUID of the modifier"),
  name: z.string().optional().describe("Exact finding name"),
  priority: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe("Priority (1–5)"),
  resolution: z.number().int().positive().optional().describe("Resolution ID"),
  status: z.number().int().positive().optional().describe("Status ID"),
  status_modified_by: z
    .string()
    .optional()
    .describe("UUID of the person who modified the status"),
  type: z.number().int().positive().optional().describe("Type ID"),
};

const ReturnAllSchema = {
  return_all: z
    .boolean()
    .optional()
    .describe("Fetch all pages automatically (default: false)"),
};

function toPaginationParams(
  args: Record<string, unknown>
): PaginationParams | undefined {
  const p: PaginationParams = {};
  if (args.page !== undefined) p.page = args.page as number;
  if (args.page_size !== undefined) p.page_size = args.page_size as number;
  if (args.order_by !== undefined) p.order_by = args.order_by as string;
  return Object.keys(p).length > 0 ? p : undefined;
}

function toFindingFilters(
  args: Record<string, unknown>
): FindingFilters | undefined {
  const f: FindingFilters = {};
  if (args.blocked !== undefined) f.blocked = args.blocked as boolean;
  if (args.category !== undefined) f.category = args.category as number;
  if (args.created_after !== undefined)
    f.created_after = args.created_after as string;
  if (args.created_before !== undefined)
    f.created_before = args.created_before as string;
  if (args.created_by !== undefined) f.created_by = args.created_by as string;
  if (args.modified_after !== undefined)
    f.modified_after = args.modified_after as string;
  if (args.modified_before !== undefined)
    f.modified_before = args.modified_before as string;
  if (args.modified_by !== undefined)
    f.modified_by = args.modified_by as string;
  if (args.name !== undefined) f.name = args.name as string;
  if (args.priority !== undefined) f.priority = args.priority as number;
  if (args.resolution !== undefined) f.resolution = args.resolution as number;
  if (args.status !== undefined) f.status = args.status as number;
  if (args.status_modified_by !== undefined)
    f.status_modified_by = args.status_modified_by as string;
  if (args.type !== undefined) f.type = args.type as number;
  return Object.keys(f).length > 0 ? f : undefined;
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

// ─── Health ────────────────────────────────────────────────────────────────────

server.tool(
  "blumira_health",
  "Check the health status of the Blumira API",
  {},
  async () => {
    try {
      const result = await client.getHealth();
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── MSP Accounts ──────────────────────────────────────────────────────────────

server.tool(
  "blumira_list_accounts",
  "List MSP accounts",
  { ...PaginationSchema, ...ReturnAllSchema },
  async (args) => {
    try {
      const result = await client.listAccounts(
        toPaginationParams(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_account",
  "Get a single MSP account by ID",
  { account_id: z.string().describe("UUID of the MSP account") },
  async (args) => {
    try {
      const result = await client.getAccount(args.account_id);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── MSP Account Findings ──────────────────────────────────────────────────────

server.tool(
  "blumira_list_account_findings",
  "List findings for a specific MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    ...PaginationSchema,
    ...FindingFilterSchema,
    ...ReturnAllSchema,
  },
  async (args) => {
    try {
      const result = await client.listAccountFindings(
        args.account_id,
        toPaginationParams(args),
        toFindingFilters(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_list_all_accounts_findings",
  "List findings across all MSP accounts",
  {
    ...PaginationSchema,
    ...FindingFilterSchema,
    ...ReturnAllSchema,
  },
  async (args) => {
    try {
      const result = await client.listAllAccountsFindings(
        toPaginationParams(args),
        toFindingFilters(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_account_finding",
  "Get a specific finding for an MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    finding_id: z.string().describe("UUID of the finding"),
  },
  async (args) => {
    try {
      const result = await client.getAccountFinding(
        args.account_id,
        args.finding_id
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_account_finding_comments",
  "List comments for a finding in an MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    finding_id: z.string().describe("UUID of the finding"),
  },
  async (args) => {
    try {
      const result = await client.getAccountFindingComments(
        args.account_id,
        args.finding_id
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── MSP Account Agent Devices ─────────────────────────────────────────────────

server.tool(
  "blumira_list_account_agent_devices",
  "List agent devices for an MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    ...PaginationSchema,
    ...ReturnAllSchema,
  },
  async (args) => {
    try {
      const result = await client.listAccountAgentDevices(
        args.account_id,
        toPaginationParams(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_account_agent_device",
  "Get a specific agent device for an MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    device_id: z.string().describe("UUID of the agent device"),
  },
  async (args) => {
    try {
      const result = await client.getAccountAgentDevice(
        args.account_id,
        args.device_id
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── MSP Account Agent Keys ────────────────────────────────────────────────────

server.tool(
  "blumira_list_account_agent_keys",
  "List agent keys for an MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    ...PaginationSchema,
    ...ReturnAllSchema,
  },
  async (args) => {
    try {
      const result = await client.listAccountAgentKeys(
        args.account_id,
        toPaginationParams(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_account_agent_key",
  "Get a specific agent key for an MSP account",
  {
    account_id: z.string().describe("UUID of the MSP account"),
    key_id: z.string().describe("UUID of the agent key"),
  },
  async (args) => {
    try {
      const result = await client.getAccountAgentKey(
        args.account_id,
        args.key_id
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── Org Agent Devices ─────────────────────────────────────────────────────────

server.tool(
  "blumira_list_org_agent_devices",
  "List agent devices for the current organization",
  { ...PaginationSchema, ...ReturnAllSchema },
  async (args) => {
    try {
      const result = await client.listOrgAgentDevices(
        toPaginationParams(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_org_agent_device",
  "Get a specific agent device for the current organization",
  { device_id: z.string().describe("UUID of the agent device") },
  async (args) => {
    try {
      const result = await client.getOrgAgentDevice(args.device_id);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── Org Agent Keys ────────────────────────────────────────────────────────────

server.tool(
  "blumira_list_org_agent_keys",
  "List agent keys for the current organization",
  { ...PaginationSchema, ...ReturnAllSchema },
  async (args) => {
    try {
      const result = await client.listOrgAgentKeys(
        toPaginationParams(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_org_agent_key",
  "Get a specific agent key for the current organization",
  { key_id: z.string().describe("UUID of the agent key") },
  async (args) => {
    try {
      const result = await client.getOrgAgentKey(args.key_id);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── Org Findings ──────────────────────────────────────────────────────────────

server.tool(
  "blumira_list_org_findings",
  "List findings for the current organization",
  {
    ...PaginationSchema,
    ...FindingFilterSchema,
    ...ReturnAllSchema,
  },
  async (args) => {
    try {
      const result = await client.listOrgFindings(
        toPaginationParams(args),
        toFindingFilters(args),
        args.return_all ?? false
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_org_finding",
  "Get a specific finding for the current organization",
  { finding_id: z.string().describe("UUID of the finding") },
  async (args) => {
    try {
      const result = await client.getOrgFinding(args.finding_id);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_org_finding_comments",
  "List comments for a finding in the current organization",
  { finding_id: z.string().describe("UUID of the finding") },
  async (args) => {
    try {
      const result = await client.getOrgFindingComments(args.finding_id);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "blumira_get_org_finding_details",
  "Get detailed information for a finding in the current organization",
  { finding_id: z.string().describe("UUID of the finding") },
  async (args) => {
    try {
      const result = await client.getOrgFindingDetails(args.finding_id);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err);
    }
  }
);

// ─── Start server ──────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting blumira-mcp server:", err);
  process.exit(1);
});

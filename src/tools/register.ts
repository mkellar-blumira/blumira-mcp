/**
 * MCP tool registration — thin adapters between the MCP protocol and
 * the Blumira client library.
 *
 * Each function:
 *   1. Reads global settings via getSettings()
 *   2. Builds a BlumiraClient with explicit config
 *   3. Delegates to the library
 *   4. Formats the result for MCP (JSON text content)
 *
 * This mirrors the purple-mcp "tools vs libs" architecture.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSettings } from "../config.js";
import { BlumiraClient } from "../libs/blumira-client.js";
import type { FindingFilters, PaginationParams, ResolveParams, AssignOwnersParams, AddCommentParams } from "../libs/blumira-client.js";
import { BlumiraError } from "../errors.js";
import { logger } from "../logger.js";
import * as desc from "./descriptions.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getClient(): BlumiraClient {
  const settings = getSettings();
  return new BlumiraClient({
    accessToken: settings.accessToken,
    baseUrl: settings.baseUrl,
  });
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof BlumiraError ? err.name : "Error";
  logger.error(`Tool error [${name}]`, { message });
  return {
    content: [{ type: "text" as const, text: `${name}: ${message}` }],
    isError: true,
  };
}

function toPagination(args: Record<string, unknown>): PaginationParams | undefined {
  const p: PaginationParams = {};
  if (args.page !== undefined) p.page = args.page as number;
  if (args.page_size !== undefined) p.page_size = args.page_size as number;
  if (args.order_by !== undefined) p.order_by = args.order_by as string;
  return Object.keys(p).length > 0 ? p : undefined;
}

function toFindingFilters(args: Record<string, unknown>): FindingFilters | undefined {
  const filterKeys = [
    "blocked", "category", "created_after", "created_before", "created_by",
    "modified_after", "modified_before", "modified_by", "name", "priority",
    "resolution", "status", "status_modified_by", "type",
  ];
  const f: FindingFilters = {};
  let hasFilter = false;
  for (const key of filterKeys) {
    if (args[key] !== undefined) {
      (f as Record<string, unknown>)[key] = args[key];
      hasFilter = true;
    }
  }
  return hasFilter ? f : undefined;
}

// ─── Shared Zod schemas ────────────────────────────────────────────────────────

const PaginationSchema = {
  page: z.number().int().positive().optional().describe("Page number (1-based)"),
  page_size: z.number().int().min(1).max(200).optional().describe("Items per page (1–200)"),
  order_by: z.string().optional().describe("Ordering, e.g. 'created;desc'"),
};

const ReturnAllSchema = {
  return_all: z.boolean().optional().describe("Fetch all pages automatically (default false)"),
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
  priority: z.number().int().min(1).max(5).optional().describe("Priority (1–5)"),
  resolution: z.number().int().positive().optional().describe("Resolution ID"),
  status: z.number().int().positive().optional().describe("Status ID"),
  status_modified_by: z.string().optional().describe("UUID of status modifier"),
  type: z.number().int().positive().optional().describe("Type ID"),
};

// ─── Registration ──────────────────────────────────────────────────────────────

export function registerTools(server: McpServer): void {
  // Health
  server.tool("blumira_health", desc.HEALTH_DESCRIPTION, {}, async () => {
    try { return jsonResult(await getClient().getHealth()); }
    catch (err) { return errorResult(err); }
  });

  // MSP Accounts
  server.tool(
    "blumira_list_accounts", desc.LIST_ACCOUNTS_DESCRIPTION,
    { ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listAccounts(toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_account", desc.GET_ACCOUNT_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account") },
    async (args) => {
      try { return jsonResult(await getClient().getAccount(args.account_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // MSP Account Findings
  server.tool(
    "blumira_list_account_findings", desc.LIST_ACCOUNT_FINDINGS_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), ...PaginationSchema, ...FindingFilterSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listAccountFindings(args.account_id, toPagination(args), toFindingFilters(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_list_all_accounts_findings", desc.LIST_ALL_ACCOUNTS_FINDINGS_DESCRIPTION,
    { ...PaginationSchema, ...FindingFilterSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listAllAccountsFindings(toPagination(args), toFindingFilters(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_account_finding", desc.GET_ACCOUNT_FINDING_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), finding_id: z.string().describe("UUID of the finding") },
    async (args) => {
      try { return jsonResult(await getClient().getAccountFinding(args.account_id, args.finding_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_account_finding_comments", desc.GET_ACCOUNT_FINDING_COMMENTS_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), finding_id: z.string().describe("UUID of the finding") },
    async (args) => {
      try { return jsonResult(await getClient().getAccountFindingComments(args.account_id, args.finding_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // MSP Account Agent Devices
  server.tool(
    "blumira_list_account_agent_devices", desc.LIST_ACCOUNT_AGENT_DEVICES_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listAccountAgentDevices(args.account_id, toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_account_agent_device", desc.GET_ACCOUNT_AGENT_DEVICE_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), device_id: z.string().describe("UUID of the agent device") },
    async (args) => {
      try { return jsonResult(await getClient().getAccountAgentDevice(args.account_id, args.device_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // MSP Account Agent Keys
  server.tool(
    "blumira_list_account_agent_keys", desc.LIST_ACCOUNT_AGENT_KEYS_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listAccountAgentKeys(args.account_id, toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_account_agent_key", desc.GET_ACCOUNT_AGENT_KEY_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), key_id: z.string().describe("UUID of the agent key") },
    async (args) => {
      try { return jsonResult(await getClient().getAccountAgentKey(args.account_id, args.key_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // Org Agent Devices
  server.tool(
    "blumira_list_org_agent_devices", desc.LIST_ORG_AGENT_DEVICES_DESCRIPTION,
    { ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listOrgAgentDevices(toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_org_agent_device", desc.GET_ORG_AGENT_DEVICE_DESCRIPTION,
    { device_id: z.string().describe("UUID of the agent device") },
    async (args) => {
      try { return jsonResult(await getClient().getOrgAgentDevice(args.device_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // Org Agent Keys
  server.tool(
    "blumira_list_org_agent_keys", desc.LIST_ORG_AGENT_KEYS_DESCRIPTION,
    { ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listOrgAgentKeys(toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_org_agent_key", desc.GET_ORG_AGENT_KEY_DESCRIPTION,
    { key_id: z.string().describe("UUID of the agent key") },
    async (args) => {
      try { return jsonResult(await getClient().getOrgAgentKey(args.key_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // Org Findings
  server.tool(
    "blumira_list_org_findings", desc.LIST_ORG_FINDINGS_DESCRIPTION,
    { ...PaginationSchema, ...FindingFilterSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listOrgFindings(toPagination(args), toFindingFilters(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_org_finding", desc.GET_ORG_FINDING_DESCRIPTION,
    { finding_id: z.string().describe("UUID of the finding") },
    async (args) => {
      try { return jsonResult(await getClient().getOrgFinding(args.finding_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_org_finding_comments", desc.GET_ORG_FINDING_COMMENTS_DESCRIPTION,
    { finding_id: z.string().describe("UUID of the finding") },
    async (args) => {
      try { return jsonResult(await getClient().getOrgFindingComments(args.finding_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_get_org_finding_details", desc.GET_ORG_FINDING_DETAILS_DESCRIPTION,
    { finding_id: z.string().describe("UUID of the finding") },
    async (args) => {
      try { return jsonResult(await getClient().getOrgFindingDetails(args.finding_id)); }
      catch (err) { return errorResult(err); }
    },
  );

  // Org Finding Actions (POST)
  server.tool(
    "blumira_resolve_org_finding", desc.RESOLVE_ORG_FINDING_DESCRIPTION,
    {
      finding_id: z.string().describe("UUID of the finding to resolve"),
      resolution: z.number().int().positive().describe("Resolution ID (e.g. 10=Valid, 20=False Positive, 30=No Action Needed, 40=Risk Accepted)"),
      resolution_notes: z.string().optional().describe("Optional notes explaining the resolution"),
    },
    async (args) => {
      try {
        const params: ResolveParams = { resolution: args.resolution };
        if (args.resolution_notes !== undefined) params.resolution_notes = args.resolution_notes;
        return jsonResult(await getClient().resolveOrgFinding(args.finding_id, params));
      } catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_assign_org_finding", desc.ASSIGN_ORG_FINDING_DESCRIPTION,
    {
      finding_id: z.string().describe("UUID of the finding"),
      owners: z.array(z.string()).describe("Array of person UUIDs to assign. Empty array clears owners."),
      owner_type: z.string().describe("Type of owners (lowercase), e.g. 'responder', 'administrator'"),
    },
    async (args) => {
      try {
        const params: AssignOwnersParams = { owners: args.owners, owner_type: args.owner_type };
        return jsonResult(await getClient().assignOrgFinding(args.finding_id, params));
      } catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_add_org_finding_comment", desc.ADD_ORG_FINDING_COMMENT_DESCRIPTION,
    {
      finding_id: z.string().describe("UUID of the finding"),
      body: z.string().describe("Comment body (may contain HTML)"),
      sender: z.string().describe("UUID of the person creating the comment"),
    },
    async (args) => {
      try {
        const params: AddCommentParams = { body: args.body, sender: args.sender };
        return jsonResult(await getClient().addOrgFindingComment(args.finding_id, params));
      } catch (err) { return errorResult(err); }
    },
  );

  // MSP Account Finding Actions (POST)
  server.tool(
    "blumira_resolve_account_finding", desc.RESOLVE_ACCOUNT_FINDING_DESCRIPTION,
    {
      account_id: z.string().describe("UUID of the MSP account"),
      finding_id: z.string().describe("UUID of the finding to resolve"),
      resolution: z.number().int().positive().describe("Resolution ID (e.g. 10=Valid, 20=False Positive, 30=No Action Needed, 40=Risk Accepted)"),
      resolution_notes: z.string().optional().describe("Optional notes explaining the resolution"),
    },
    async (args) => {
      try {
        const params: ResolveParams = { resolution: args.resolution };
        if (args.resolution_notes !== undefined) params.resolution_notes = args.resolution_notes;
        return jsonResult(await getClient().resolveAccountFinding(args.account_id, args.finding_id, params));
      } catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_assign_account_finding", desc.ASSIGN_ACCOUNT_FINDING_DESCRIPTION,
    {
      account_id: z.string().describe("UUID of the MSP account"),
      finding_id: z.string().describe("UUID of the finding"),
      owners: z.array(z.string()).describe("Array of person UUIDs to assign. Empty array clears owners."),
      owner_type: z.string().describe("Type of owners (lowercase), e.g. 'responder', 'administrator'"),
    },
    async (args) => {
      try {
        const params: AssignOwnersParams = { owners: args.owners, owner_type: args.owner_type };
        return jsonResult(await getClient().assignAccountFinding(args.account_id, args.finding_id, params));
      } catch (err) { return errorResult(err); }
    },
  );

  server.tool(
    "blumira_add_account_finding_comment", desc.ADD_ACCOUNT_FINDING_COMMENT_DESCRIPTION,
    {
      account_id: z.string().describe("UUID of the MSP account"),
      finding_id: z.string().describe("UUID of the finding"),
      body: z.string().describe("Comment body (may contain HTML)"),
      sender: z.string().describe("UUID of the person creating the comment"),
    },
    async (args) => {
      try {
        const params: AddCommentParams = { body: args.body, sender: args.sender };
        return jsonResult(await getClient().addAccountFindingComment(args.account_id, args.finding_id, params));
      } catch (err) { return errorResult(err); }
    },
  );

  // Org Users
  server.tool(
    "blumira_list_org_users", desc.LIST_ORG_USERS_DESCRIPTION,
    { ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listOrgUsers(toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  // MSP Account Users
  server.tool(
    "blumira_list_account_users", desc.LIST_ACCOUNT_USERS_DESCRIPTION,
    { account_id: z.string().describe("UUID of the MSP account"), ...PaginationSchema, ...ReturnAllSchema },
    async (args) => {
      try { return jsonResult(await getClient().listAccountUsers(args.account_id, toPagination(args), args.return_all ?? false)); }
      catch (err) { return errorResult(err); }
    },
  );

  // Resolutions
  server.tool(
    "blumira_list_resolutions", desc.LIST_RESOLUTIONS_DESCRIPTION,
    {},
    async () => {
      try { return jsonResult(await getClient().listResolutions()); }
      catch (err) { return errorResult(err); }
    },
  );
}

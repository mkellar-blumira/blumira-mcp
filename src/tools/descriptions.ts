/**
 * Rich tool descriptions for the Blumira MCP server.
 *
 * Following the purple-mcp pattern, each tool gets a detailed multi-line
 * description that tells the LLM exactly what the tool does, what it
 * returns, common use-cases, and any caveats.  This dramatically
 * improves tool-selection accuracy.
 */

// ─── Health ────────────────────────────────────────────────────────────────────

export const HEALTH_DESCRIPTION = `\
Check the health status of the Blumira Public API.

Returns:
  JSON object with API health status information.

Common Use Cases:
  - Verify API connectivity before running other queries.
  - Quick smoke-test that the access token is valid.
`;

// ─── MSP Accounts ──────────────────────────────────────────────────────────────

export const LIST_ACCOUNTS_DESCRIPTION = `\
List MSP (Managed Service Provider) accounts.

Retrieves a paginated list of accounts visible to the current token.
Use return_all=true to automatically page through all results.

Args:
  page: Page number (1-based, optional).
  page_size: Items per page, 1–200 (optional, default 50).
  order_by: Ordering expression, e.g. "created;desc" or "name;asc" (optional).
  return_all: If true, fetches every page automatically (default false).

Returns:
  Array of account objects, each containing at minimum:
  - id: UUID of the account
  - name: Display name of the account
  - Additional account metadata

Common Use Cases:
  - Dashboard overview of all managed accounts.
  - Enumerate accounts before drilling into findings or devices.
`;

export const GET_ACCOUNT_DESCRIPTION = `\
Get a single MSP account by its unique ID.

Args:
  account_id: UUID of the MSP account (required).

Returns:
  Account object with full metadata (id, name, settings, etc.).

Common Use Cases:
  - Retrieve details for a specific account after listing.
  - Confirm account existence before querying its findings.

Raises:
  Error if account_id is empty or the account does not exist.
`;

// ─── MSP Account Findings ──────────────────────────────────────────────────────

export const LIST_ACCOUNT_FINDINGS_DESCRIPTION = `\
List security findings for a specific MSP account.

Supports pagination, filtering by date ranges, priority, status, category,
and other criteria.  Use return_all=true to fetch every page automatically.

Args:
  account_id: UUID of the MSP account (required).
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).
  blocked, category, priority, status, type, resolution: Finding filters (optional).
  created_after, created_before: ISO 8601 timestamps for creation date range (optional).
  modified_after, modified_before: ISO 8601 timestamps for modification date range (optional).
  created_by, modified_by, status_modified_by: UUIDs of users (optional).
  name: Exact finding name (optional).

Returns:
  Array of finding objects containing severity, status, timestamps, and related data.

Common Use Cases:
  - Triage findings for a specific customer account.
  - Filter high-priority or recent findings for incident response.
  - Compliance reporting across time ranges.
`;

export const LIST_ALL_ACCOUNTS_FINDINGS_DESCRIPTION = `\
List security findings across ALL MSP accounts.

Same filtering and pagination as list_account_findings, but aggregates
findings from every managed account.  Useful for MSP-wide dashboards.

Args:
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).
  Finding filter parameters: Same as list_account_findings.

Returns:
  Array of finding objects from all accounts.

Common Use Cases:
  - MSP-wide security posture overview.
  - Cross-account trending and reporting.
`;

export const GET_ACCOUNT_FINDING_DESCRIPTION = `\
Get a specific finding for an MSP account.

Args:
  account_id: UUID of the MSP account (required).
  finding_id: UUID of the finding (required).

Returns:
  Full finding object with severity, status, timestamps, evidence, and context.

Common Use Cases:
  - Deep-dive into a specific alert or finding.
  - Gather evidence for incident investigation.
`;

export const GET_ACCOUNT_FINDING_COMMENTS_DESCRIPTION = `\
List comments attached to a finding in an MSP account.

Comments are analyst notes, investigation steps, and collaboration history
for a specific finding.

Args:
  account_id: UUID of the MSP account (required).
  finding_id: UUID of the finding (required).

Returns:
  Array of comment objects with text, author, and timestamps.

Common Use Cases:
  - Review investigation history for a finding.
  - Audit trail for compliance.
`;

// ─── MSP Account Agent Devices ─────────────────────────────────────────────────

export const LIST_ACCOUNT_AGENT_DEVICES_DESCRIPTION = `\
List agent devices for an MSP account.

Agent devices are endpoints with the Blumira agent installed.
Supports pagination and return_all.

Args:
  account_id: UUID of the MSP account (required).
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).

Returns:
  Array of agent device objects with device info, status, and metadata.

Common Use Cases:
  - Inventory of monitored endpoints for an account.
  - Verify agent deployment coverage.
`;

export const GET_ACCOUNT_AGENT_DEVICE_DESCRIPTION = `\
Get a specific agent device for an MSP account.

Args:
  account_id: UUID of the MSP account (required).
  device_id: UUID of the agent device (required).

Returns:
  Device object with full metadata (hostname, OS, agent version, etc.).
`;

// ─── MSP Account Agent Keys ────────────────────────────────────────────────────

export const LIST_ACCOUNT_AGENT_KEYS_DESCRIPTION = `\
List agent keys for an MSP account.

Agent keys are used to register new agent devices.

Args:
  account_id: UUID of the MSP account (required).
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).

Returns:
  Array of agent key objects.

Common Use Cases:
  - Manage deployment keys for agent rollout.
`;

export const GET_ACCOUNT_AGENT_KEY_DESCRIPTION = `\
Get a specific agent key for an MSP account.

Args:
  account_id: UUID of the MSP account (required).
  key_id: UUID of the agent key (required).

Returns:
  Agent key object with key details and metadata.
`;

// ─── Org Agent Devices ─────────────────────────────────────────────────────────

export const LIST_ORG_AGENT_DEVICES_DESCRIPTION = `\
List agent devices for the current organization.

Similar to the MSP account version but scoped to the org-level token.

Args:
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).

Returns:
  Array of agent device objects.

Common Use Cases:
  - Org-wide endpoint inventory.
  - Agent health monitoring.
`;

export const GET_ORG_AGENT_DEVICE_DESCRIPTION = `\
Get a specific agent device for the current organization.

Args:
  device_id: UUID of the agent device (required).

Returns:
  Device object with full metadata.
`;

// ─── Org Agent Keys ────────────────────────────────────────────────────────────

export const LIST_ORG_AGENT_KEYS_DESCRIPTION = `\
List agent keys for the current organization.

Args:
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).

Returns:
  Array of agent key objects.
`;

export const GET_ORG_AGENT_KEY_DESCRIPTION = `\
Get a specific agent key for the current organization.

Args:
  key_id: UUID of the agent key (required).

Returns:
  Agent key object with key details and metadata.
`;

// ─── Org Findings ──────────────────────────────────────────────────────────────

export const LIST_ORG_FINDINGS_DESCRIPTION = `\
List security findings for the current organization.

Supports the same pagination and finding filters as the MSP account
version, but scoped to the org-level token.

Args:
  page, page_size, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).
  Finding filter parameters: blocked, category, priority, status, type,
    resolution, created_after/before, modified_after/before, name,
    created_by, modified_by, status_modified_by.

Returns:
  Array of finding objects with severity, status, timestamps, and context.

Common Use Cases:
  - Org-wide security dashboard.
  - Triage and incident response.
  - Filtering findings by priority or date range.
`;

export const GET_ORG_FINDING_DESCRIPTION = `\
Get a specific finding for the current organization.

Args:
  finding_id: UUID of the finding (required).

Returns:
  Full finding object with all available fields.

Common Use Cases:
  - Detailed investigation of a specific finding.
`;

export const GET_ORG_FINDING_COMMENTS_DESCRIPTION = `\
List comments for a finding in the current organization.

Args:
  finding_id: UUID of the finding (required).

Returns:
  Array of comment objects with text, author, and timestamps.

Common Use Cases:
  - Review analyst notes and investigation history.
  - Audit trail.
`;

export const GET_ORG_FINDING_DETAILS_DESCRIPTION = `\
Get detailed information for a finding in the current organization.

Returns enriched finding data beyond what the standard get endpoint provides.

Args:
  finding_id: UUID of the finding (required).

Returns:
  Detailed finding object with extended evidence and context data.

Common Use Cases:
  - Deep forensic investigation.
  - Evidence gathering for reports.
`;

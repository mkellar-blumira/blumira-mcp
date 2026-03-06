/**
 * Rich tool descriptions for the Blumira MCP server.
 *
 * Each tool gets a detailed multi-line
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
  page, page_size, limit, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).
  blocked, category, priority, status, type, resolution: Finding filters (optional).
  created_after, created_before: ISO 8601 timestamps for creation date range (optional).
  modified_after, modified_before: ISO 8601 timestamps for modification date range (optional).
  created_by, modified_by, status_modified_by: UUIDs of users (optional).
  name: Exact finding name (optional).
  advanced_filters: Raw Blumira query params for newer filters such as
    name_contains, name_regex, priority_in, status_not_in, or created_lt.

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
  page, page_size, limit, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).
  Finding filter parameters: Same as list_account_findings, including
    advanced_filters for raw API query operators.

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

export const GET_ACCOUNT_FINDING_EVIDENCE_DESCRIPTION = `\
Get evidence rows for a finding in an MSP account.

Returns the field names present in the evidence rows plus paginated evidence
data. Use return_all=true to automatically collect every evidence page, or
use limit to cap the total number of returned rows.

Args:
  account_id: UUID of the MSP account (required).
  finding_id: UUID of the finding (required).
  page, page_size, limit, order_by: Evidence pagination options (optional).
  return_all: Fetch all evidence pages automatically (default false).

Returns:
  Object containing:
  - evidence_keys: ordered list of field names present in each row
  - data: array of dynamic evidence row objects
  - links/meta/status: pagination metadata from the API

Common Use Cases:
  - Pull raw evidence rows for analyst review.
  - Export finding evidence for incident reports.
  - Inspect rule-specific fields such as src_ip, user, or __time_matched.
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
  page, page_size, limit, order_by: Pagination options (optional).
  return_all: Fetch all pages automatically (default false).
  Finding filter parameters: blocked, category, priority, status, type,
    resolution, created_after/before, modified_after/before, name,
    created_by, modified_by, status_modified_by.
  advanced_filters: Raw Blumira query params for newer filters such as
    name_contains, name_regex, priority_in, status_not_in, or created_lt.

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

Returns enriched finding data beyond what the standard get endpoint provides,
including category_name, jurisdiction_name, owners, resolution details,
executive summary (<=512 chars), and a direct URL to the finding in the UI.

Args:
  finding_id: UUID of the finding (required).

Returns:
  Detailed finding object with extended evidence and context data including:
  - category_name: e.g. "Malicious Code", "Unauthorized Access Attempt"
  - jurisdiction_name: e.g. "administrator", "responder"
  - owners: object with types and UUIDs of finding owners
  - resolution / resolution_name / resolution_notes: resolution status
  - summary: executive summary (<=512 characters)
  - url: direct link to the finding in the Blumira UI

Common Use Cases:
  - Deep forensic investigation.
  - Evidence gathering for reports.
  - Getting the UI URL to share with team members.
`;

export const GET_ORG_FINDING_EVIDENCE_DESCRIPTION = `\
Get evidence rows for a finding in the current organization.

Returns the field names present in the evidence rows plus paginated evidence
data. Use return_all=true to automatically collect every evidence page, or
use limit to cap the total number of returned rows.

Args:
  finding_id: UUID of the finding (required).
  page, page_size, limit, order_by: Evidence pagination options (optional).
  return_all: Fetch all evidence pages automatically (default false).

Returns:
  Object containing:
  - evidence_keys: ordered list of field names present in each row
  - data: array of dynamic evidence row objects
  - links/meta/status: pagination metadata from the API

Common Use Cases:
  - Pull raw evidence rows for analyst review.
  - Export finding evidence for incident reports.
  - Inspect rule-specific fields such as src_ip, user, or __time_matched.
`;

// ─── Org Finding Actions (POST) ────────────────────────────────────────────

export const RESOLVE_ORG_FINDING_DESCRIPTION = `\
Resolve a security finding for the current organization.

Changes a finding's status to resolved with a specified resolution type
and optional notes. This is a write operation that modifies finding state.

IMPORTANT: Before calling this tool, use blumira_list_resolutions to get
the valid resolution IDs for your environment.

Args:
  finding_id: UUID of the finding to resolve (required).
  resolution: Resolution ID (required). Standard values:
    - 10 = Valid
    - 20 = False Positive
    - 30 = No Action Needed
    - 40 = Risk Accepted
  resolution_notes: Optional free-text notes explaining the resolution (optional).

Returns:
  Updated finding detail object with the new resolution status.

Common Use Cases:
  - Close out findings after investigation.
  - Mark false positives to reduce noise.
  - Document risk acceptance decisions with notes.
  - Bulk triage of low-priority findings.

Raises:
  Error if finding_id is empty, resolution is invalid, or the finding does not exist.
`;

export const ASSIGN_ORG_FINDING_DESCRIPTION = `\
Assign owners to a security finding for the current organization.

Sets or updates the owners of a finding. Pass an empty owners array to
clear all owners for the specified owner_type.

IMPORTANT: Use blumira_list_org_users to obtain valid user UUIDs before
calling this tool.

Args:
  finding_id: UUID of the finding (required).
  owners: Array of person UUIDs to assign as owners (required).
    Pass an empty array [] to clear all owners for the given owner_type.
  owner_type: Type of owners to assign (required). Must be lowercase.
    Common values: "responder", "administrator".

Returns:
  Updated finding detail object with the new owner assignments.

Common Use Cases:
  - Assign a finding to a specific analyst for investigation.
  - Escalate a finding to an administrator.
  - Clear ownership when reassigning workload.

Raises:
  Error if finding_id is empty, owners is not an array, or owner_type is missing.
`;

export const ADD_ORG_FINDING_COMMENT_DESCRIPTION = `\
Add a comment to a security finding for the current organization.

Posts a new analyst note or comment to a finding's collaboration thread.
Comments support HTML content for rich formatting.

IMPORTANT: Use blumira_list_org_users to obtain the sender UUID (your user ID)
before calling this tool.

Args:
  finding_id: UUID of the finding (required).
  body: Comment body text (required, non-empty). May contain HTML for
    rich formatting (bold, links, lists, etc.).
  sender: UUID of the person creating the comment (required).
    Use blumira_list_org_users to find your user ID.

Returns:
  Created comment object with:
  - id: Comment ID
  - body: HTML body of the comment
  - subject: Comment subject
  - age: Age in seconds
  - sender: { id, first_name, last_name, email }

Common Use Cases:
  - Document investigation steps and findings.
  - Collaborate with team members on a finding.
  - Add context or evidence notes during triage.
  - Maintain an audit trail of analyst actions.

Raises:
  Error if finding_id or sender is empty, or body is blank.
`;

// ─── MSP Account Finding Actions (POST) ────────────────────────────────────

export const RESOLVE_ACCOUNT_FINDING_DESCRIPTION = `\
Resolve a security finding for a specific MSP account.

Changes a finding's status to resolved with a specified resolution type
and optional notes. This is a write operation that modifies finding state.

IMPORTANT: Before calling this tool, use blumira_list_resolutions to get
the valid resolution IDs for your environment.

Args:
  account_id: UUID of the MSP account (required).
  finding_id: UUID of the finding to resolve (required).
  resolution: Resolution ID (required). Standard values:
    - 10 = Valid
    - 20 = False Positive
    - 30 = No Action Needed
    - 40 = Risk Accepted
  resolution_notes: Optional free-text notes explaining the resolution (optional).

Returns:
  Updated finding detail object with the new resolution status.

Common Use Cases:
  - Resolve findings for a specific managed customer.
  - Mark false positives during MSP-level triage.
  - Document risk acceptance with notes for compliance.

Raises:
  Error if account_id or finding_id is empty, or resolution is invalid.
`;

export const ASSIGN_ACCOUNT_FINDING_DESCRIPTION = `\
Assign owners to a security finding for a specific MSP account.

Sets or updates the owners of a finding within a managed account.
Pass an empty owners array to clear all owners for the specified owner_type.

IMPORTANT: Use blumira_list_account_users to obtain valid user UUIDs for
the target account before calling this tool.

Args:
  account_id: UUID of the MSP account (required).
  finding_id: UUID of the finding (required).
  owners: Array of person UUIDs to assign as owners (required).
    Pass an empty array [] to clear all owners for the given owner_type.
  owner_type: Type of owners to assign (required). Must be lowercase.
    Common values: "responder", "administrator".

Returns:
  Updated finding detail object with the new owner assignments.

Common Use Cases:
  - Assign findings to analysts within a managed account.
  - Escalate findings to an account administrator.
  - Clear ownership when reassigning workload.

Raises:
  Error if account_id or finding_id is empty, owners is not an array, or owner_type is missing.
`;

export const ADD_ACCOUNT_FINDING_COMMENT_DESCRIPTION = `\
Add a comment to a security finding for a specific MSP account.

Posts a new analyst note or comment to a finding's collaboration thread
within a managed account. Comments support HTML content.

IMPORTANT: Use blumira_list_account_users to obtain the sender UUID
for the target account before calling this tool.

Args:
  account_id: UUID of the MSP account (required).
  finding_id: UUID of the finding (required).
  body: Comment body text (required, non-empty). May contain HTML.
  sender: UUID of the person creating the comment (required).
    Use blumira_list_account_users to find valid user IDs.

Returns:
  Created comment object with id, body, subject, age, and sender info.

Common Use Cases:
  - Document investigation steps for a managed customer's finding.
  - Collaborate across MSP team on an account finding.
  - Maintain audit trail for compliance.

Raises:
  Error if account_id, finding_id, or sender is empty, or body is blank.
`;

// ─── Org Users ─────────────────────────────────────────────────────────────

export const LIST_ORG_USERS_DESCRIPTION = `\
List users for the current organization.

Retrieves a paginated list of users in your organization.
Use return_all=true to automatically page through all results.

IMPORTANT: This tool is essential for finding user UUIDs needed by
blumira_assign_org_finding and blumira_add_org_finding_comment.

Args:
  page: Page number (1-based, optional).
  page_size: Items per page, 1–200 (optional, default 50).
  return_all: If true, fetches every page automatically (default false).

Returns:
  Array of user objects, each containing:
  - id: UUID of the user
  - email: User email address
  - first_name: User first name
  - last_name: User last name
  - org_roles: List of roles for this user in the organization

Common Use Cases:
  - Look up user UUIDs before assigning findings or adding comments.
  - Audit user access and roles in the organization.
  - Build a user directory for the security team.
`;

// ─── MSP Account Users ─────────────────────────────────────────────────────

export const LIST_ACCOUNT_USERS_DESCRIPTION = `\
List users for a specific MSP account.

Retrieves a paginated list of users in a managed account.
Use return_all=true to automatically page through all results.

IMPORTANT: This tool is essential for finding user UUIDs needed by
blumira_assign_account_finding and blumira_add_account_finding_comment.

Args:
  account_id: UUID of the MSP account (required).
  page: Page number (1-based, optional).
  page_size: Items per page, 1–200 (optional, default 50).
  return_all: If true, fetches every page automatically (default false).

Returns:
  Array of user objects, each containing:
  - id: UUID of the user
  - email: User email address
  - first_name: User first name
  - last_name: User last name
  - org_roles: List of roles for this user in the account

Common Use Cases:
  - Look up user UUIDs before assigning findings or adding comments for an account.
  - Audit user access within a managed account.
`;

// ─── Resolutions ───────────────────────────────────────────────────────────

export const LIST_RESOLUTIONS_DESCRIPTION = `\
Get the list of available resolution options for findings.

Returns all valid resolution IDs and their names that can be used with
blumira_resolve_org_finding and blumira_resolve_account_finding.

IMPORTANT: Always call this tool before resolving a finding to ensure
you use a valid resolution ID.

Args:
  None.

Returns:
  List of resolution objects, each containing:
  - id: Resolution ID (integer)
  - name: Human-readable resolution name

  Standard resolutions:
  - 10 = Valid
  - 20 = False Positive
  - 30 = No Action Needed
  - 40 = Risk Accepted

Common Use Cases:
  - Look up valid resolution IDs before resolving findings.
  - Display resolution options to the user for selection.
  - Validate resolution values in workflows.
`;

/**
 * Blumira Public API client — standalone, reusable business logic.
 *
 * This module contains ZERO MCP-specific code and ZERO global state.
 * All configuration is passed explicitly via BlumiraClientConfig.
 * This keeps the library fully testable in isolation and usable
 * outside the MCP context.
 */

import {
  BlumiraApiError,
  BlumiraAuthenticationError,
  BlumiraNetworkError,
  BlumiraNotFoundError,
  BlumiraValidationError,
} from "../errors.js";
import { logger } from "../logger.js";

// ─── Configuration ─────────────────────────────────────────────────────────────

export interface BlumiraClientConfig {
  accessToken: string;
  baseUrl: string;
}

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  [key: string]: unknown;
  page?: number;
  page_size?: number;
  order_by?: string;
}

export interface FindingFilters {
  [key: string]: unknown;
  blocked?: boolean;
  category?: number;
  created_after?: string;
  created_before?: string;
  created_by?: string;
  modified_after?: string;
  modified_before?: string;
  modified_by?: string;
  name?: string;
  priority?: number;
  resolution?: number;
  status?: number;
  status_modified_by?: string;
  type?: number;
}

export interface PaginatedResponse<T = Record<string, unknown>> {
  data: T[];
  links?: { next?: string; previous?: string };
  meta?: { total?: number; page?: number; page_size?: number };
}

export interface ResolveParams {
  [key: string]: unknown;
  resolution: number;
  resolution_notes?: string;
}

export interface AssignOwnersParams {
  [key: string]: unknown;
  owners: string[];
  owner_type: string;
}

export interface AddCommentParams {
  [key: string]: unknown;
  body: string;
  sender: string;
}

// ─── Validation helpers ────────────────────────────────────────────────────────

function validateUUID(value: string, label: string): void {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BlumiraValidationError(`${label} cannot be empty.`);
  }
}

function validatePagination(params?: PaginationParams): void {
  if (!params) return;
  if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
    throw new BlumiraValidationError("page must be a positive integer.");
  }
  if (params.page_size !== undefined) {
    if (!Number.isInteger(params.page_size) || params.page_size < 1 || params.page_size > 200) {
      throw new BlumiraValidationError("page_size must be an integer between 1 and 200.");
    }
  }
}

// ─── Client ────────────────────────────────────────────────────────────────────

export class BlumiraClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;

  constructor(config: BlumiraClientConfig) {
    if (!config.accessToken) {
      throw new BlumiraValidationError("Blumira access token is required.");
    }
    if (!config.baseUrl) {
      throw new BlumiraValidationError("Blumira base URL is required.");
    }
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl;
  }

  // ─── HTTP layer ────────────────────────────────────────────────────────────

  private async request<T = Record<string, unknown>>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params && method === "GET") {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };

    const init: RequestInit = { method, headers };
    if (params && method !== "GET") {
      init.body = JSON.stringify(params);
    }

    logger.debug("API request", { method, endpoint });

    let response: Response;
    try {
      response = await fetch(url.toString(), init);
    } catch (err) {
      throw new BlumiraNetworkError(
        `Network error calling ${method} ${endpoint}: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err as Error },
      );
    }

    if (response.status === 401 || response.status === 403) {
      const body = await response.text();
      throw new BlumiraAuthenticationError(
        `Authentication failed (${response.status}): ${body}`,
      );
    }

    if (response.status === 404) {
      const body = await response.text();
      throw new BlumiraNotFoundError("resource", endpoint, { cause: new Error(body) });
    }

    if (!response.ok) {
      const body = await response.text();
      throw new BlumiraApiError(response.status, body);
    }

    return (await response.json()) as T;
  }

  private async requestAllPages<T = Record<string, unknown>>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<T[]> {
    const allItems: T[] = [];
    const pageSize = typeof params?.page_size === "number" ? params.page_size : 50;
    let page = 1;

    while (true) {
      const response = await this.request<PaginatedResponse<T>>(
        "GET",
        endpoint,
        { ...params, page, page_size: pageSize },
      );

      const items = response.data ?? (response as unknown);
      if (Array.isArray(items)) {
        allItems.push(...items);
      } else if (
        typeof items === "object" &&
        items !== null &&
        Object.keys(items as Record<string, unknown>).length > 0
      ) {
        allItems.push(items as T);
        break;
      }

      const nextLink = response.links?.next;
      const returnedCount = Array.isArray(items) ? items.length : 0;
      if (!nextLink || returnedCount === 0) break;
      page += 1;
    }

    return allItems;
  }

  private buildFindingFilters(filters?: FindingFilters): Record<string, unknown> {
    if (!filters) return {};
    const qs: Record<string, unknown> = {};
    if (filters.blocked !== undefined) qs.blocked = filters.blocked;
    if (filters.category) qs.category = filters.category;
    if (filters.created_after) qs.created_after = filters.created_after;
    if (filters.created_before) qs.created_before = filters.created_before;
    if (filters.created_by) qs.created_by = filters.created_by;
    if (filters.modified_after) qs.modified_after = filters.modified_after;
    if (filters.modified_before) qs.modified_before = filters.modified_before;
    if (filters.modified_by) qs.modified_by = filters.modified_by;
    if (filters.name) qs.name = filters.name;
    if (filters.priority) qs.priority = filters.priority;
    if (filters.resolution) qs.resolution = filters.resolution;
    if (filters.status) qs.status = filters.status;
    if (filters.status_modified_by) qs.status_modified_by = filters.status_modified_by;
    if (filters.type) qs.type = filters.type;
    return qs;
  }

  // ─── Health ──────────────────────────────────────────────────────────────

  async getHealth(): Promise<Record<string, unknown>> {
    return this.request("GET", "/health");
  }

  // ─── MSP Accounts ────────────────────────────────────────────────────────

  async listAccounts(
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages("/msp/accounts", pagination);
    const response = await this.request<PaginatedResponse>("GET", "/msp/accounts", pagination);
    return response.data ?? [];
  }

  async getAccount(accountId: string): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/msp/accounts/${accountId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // ─── MSP Account Findings ────────────────────────────────────────────────

  async listAccountFindings(
    accountId: string,
    pagination?: PaginationParams,
    filters?: FindingFilters,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validateUUID(accountId, "account_id");
    validatePagination(pagination);
    const params = { ...pagination, ...this.buildFindingFilters(filters) };
    if (returnAll) return this.requestAllPages(`/msp/accounts/${accountId}/findings`, params);
    const response = await this.request<PaginatedResponse>(
      "GET", `/msp/accounts/${accountId}/findings`, params,
    );
    return response.data ?? [];
  }

  async listAllAccountsFindings(
    pagination?: PaginationParams,
    filters?: FindingFilters,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validatePagination(pagination);
    const params = { ...pagination, ...this.buildFindingFilters(filters) };
    if (returnAll) return this.requestAllPages("/msp/accounts/findings", params);
    const response = await this.request<PaginatedResponse>(
      "GET", "/msp/accounts/findings", params,
    );
    return response.data ?? [];
  }

  async getAccountFinding(
    accountId: string,
    findingId: string,
  ): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    validateUUID(findingId, "finding_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/msp/accounts/${accountId}/findings/${findingId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  async getAccountFindingComments(
    accountId: string,
    findingId: string,
  ): Promise<Record<string, unknown>[]> {
    validateUUID(accountId, "account_id");
    validateUUID(findingId, "finding_id");
    const response = await this.request<PaginatedResponse>(
      "GET", `/msp/accounts/${accountId}/findings/${findingId}/comments`,
    );
    return Array.isArray(response.data) ? response.data : [response.data ?? response];
  }

  // ─── MSP Account Agent Devices ───────────────────────────────────────────

  async listAccountAgentDevices(
    accountId: string,
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validateUUID(accountId, "account_id");
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages(`/msp/accounts/${accountId}/agents/devices`, pagination);
    const response = await this.request<PaginatedResponse>(
      "GET", `/msp/accounts/${accountId}/agents/devices`, pagination,
    );
    return response.data ?? [];
  }

  async getAccountAgentDevice(
    accountId: string,
    deviceId: string,
  ): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    validateUUID(deviceId, "device_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/msp/accounts/${accountId}/agents/devices/${deviceId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // ─── MSP Account Agent Keys ──────────────────────────────────────────────

  async listAccountAgentKeys(
    accountId: string,
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validateUUID(accountId, "account_id");
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages(`/msp/accounts/${accountId}/agents/keys`, pagination);
    const response = await this.request<PaginatedResponse>(
      "GET", `/msp/accounts/${accountId}/agents/keys`, pagination,
    );
    return response.data ?? [];
  }

  async getAccountAgentKey(
    accountId: string,
    keyId: string,
  ): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    validateUUID(keyId, "key_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/msp/accounts/${accountId}/agents/keys/${keyId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // ─── Org Agent Devices ───────────────────────────────────────────────────

  async listOrgAgentDevices(
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages("/org/agents/devices", pagination);
    const response = await this.request<PaginatedResponse>("GET", "/org/agents/devices", pagination);
    return response.data ?? [];
  }

  async getOrgAgentDevice(deviceId: string): Promise<Record<string, unknown>> {
    validateUUID(deviceId, "device_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/org/agents/devices/${deviceId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // ─── Org Agent Keys ──────────────────────────────────────────────────────

  async listOrgAgentKeys(
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages("/org/agents/keys", pagination);
    const response = await this.request<PaginatedResponse>("GET", "/org/agents/keys", pagination);
    return response.data ?? [];
  }

  async getOrgAgentKey(keyId: string): Promise<Record<string, unknown>> {
    validateUUID(keyId, "key_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/org/agents/keys/${keyId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // ─── Org Findings ────────────────────────────────────────────────────────

  async listOrgFindings(
    pagination?: PaginationParams,
    filters?: FindingFilters,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validatePagination(pagination);
    const params = { ...pagination, ...this.buildFindingFilters(filters) };
    if (returnAll) return this.requestAllPages("/org/findings", params);
    const response = await this.request<PaginatedResponse>("GET", "/org/findings", params);
    return response.data ?? [];
  }

  async getOrgFinding(findingId: string): Promise<Record<string, unknown>> {
    validateUUID(findingId, "finding_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/org/findings/${findingId}`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  async getOrgFindingComments(findingId: string): Promise<Record<string, unknown>[]> {
    validateUUID(findingId, "finding_id");
    const response = await this.request<PaginatedResponse>(
      "GET", `/org/findings/${findingId}/comments`,
    );
    return Array.isArray(response.data) ? response.data : [response.data ?? response];
  }

  async getOrgFindingDetails(findingId: string): Promise<Record<string, unknown>> {
    validateUUID(findingId, "finding_id");
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET", `/org/findings/${findingId}/details`,
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // ─── Org Finding Actions (POST) ──────────────────────────────────────────

  async resolveOrgFinding(
    findingId: string,
    params: ResolveParams,
  ): Promise<Record<string, unknown>> {
    validateUUID(findingId, "finding_id");
    if (!Number.isInteger(params.resolution) || params.resolution < 1) {
      throw new BlumiraValidationError("resolution must be a positive integer (e.g. 10=Valid, 20=False Positive, 30=No Action Needed, 40=Risk Accepted).");
    }
    if (params.resolution_notes !== undefined && typeof params.resolution_notes !== "string") {
      throw new BlumiraValidationError("resolution_notes must be a string.");
    }
    return this.request("POST", `/org/findings/${findingId}/resolve`, params);
  }

  async assignOrgFinding(
    findingId: string,
    params: AssignOwnersParams,
  ): Promise<Record<string, unknown>> {
    validateUUID(findingId, "finding_id");
    if (!Array.isArray(params.owners)) {
      throw new BlumiraValidationError("owners must be an array of person UUIDs.");
    }
    if (!params.owner_type || typeof params.owner_type !== "string") {
      throw new BlumiraValidationError("owner_type is required and must be a lowercase string.");
    }
    return this.request("POST", `/org/findings/${findingId}/assign`, params);
  }

  async addOrgFindingComment(
    findingId: string,
    params: AddCommentParams,
  ): Promise<Record<string, unknown>> {
    validateUUID(findingId, "finding_id");
    if (!params.body || typeof params.body !== "string" || !params.body.trim()) {
      throw new BlumiraValidationError("body is required and must be a non-empty string.");
    }
    validateUUID(params.sender, "sender");
    return this.request("POST", `/org/findings/${findingId}/comments`, params);
  }

  // ─── MSP Account Finding Actions (POST) ──────────────────────────────────

  async resolveAccountFinding(
    accountId: string,
    findingId: string,
    params: ResolveParams,
  ): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    validateUUID(findingId, "finding_id");
    if (!Number.isInteger(params.resolution) || params.resolution < 1) {
      throw new BlumiraValidationError("resolution must be a positive integer (e.g. 10=Valid, 20=False Positive, 30=No Action Needed, 40=Risk Accepted).");
    }
    if (params.resolution_notes !== undefined && typeof params.resolution_notes !== "string") {
      throw new BlumiraValidationError("resolution_notes must be a string.");
    }
    return this.request("POST", `/msp/accounts/${accountId}/findings/${findingId}/resolve`, params);
  }

  async assignAccountFinding(
    accountId: string,
    findingId: string,
    params: AssignOwnersParams,
  ): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    validateUUID(findingId, "finding_id");
    if (!Array.isArray(params.owners)) {
      throw new BlumiraValidationError("owners must be an array of person UUIDs.");
    }
    if (!params.owner_type || typeof params.owner_type !== "string") {
      throw new BlumiraValidationError("owner_type is required and must be a lowercase string.");
    }
    return this.request("POST", `/msp/accounts/${accountId}/findings/${findingId}/assign`, params);
  }

  async addAccountFindingComment(
    accountId: string,
    findingId: string,
    params: AddCommentParams,
  ): Promise<Record<string, unknown>> {
    validateUUID(accountId, "account_id");
    validateUUID(findingId, "finding_id");
    if (!params.body || typeof params.body !== "string" || !params.body.trim()) {
      throw new BlumiraValidationError("body is required and must be a non-empty string.");
    }
    validateUUID(params.sender, "sender");
    return this.request("POST", `/msp/accounts/${accountId}/findings/${findingId}/comments`, params);
  }

  // ─── Org Users ───────────────────────────────────────────────────────────

  async listOrgUsers(
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages("/org/users", pagination);
    const response = await this.request<PaginatedResponse>("GET", "/org/users", pagination);
    return response.data ?? [];
  }

  // ─── MSP Account Users ───────────────────────────────────────────────────

  async listAccountUsers(
    accountId: string,
    pagination?: PaginationParams,
    returnAll = false,
  ): Promise<Record<string, unknown>[]> {
    validateUUID(accountId, "account_id");
    validatePagination(pagination);
    if (returnAll) return this.requestAllPages(`/msp/accounts/${accountId}/users`, pagination);
    const response = await this.request<PaginatedResponse>(
      "GET", `/msp/accounts/${accountId}/users`, pagination,
    );
    return response.data ?? [];
  }

  // ─── Resolutions ─────────────────────────────────────────────────────────

  async listResolutions(): Promise<Record<string, unknown>> {
    return this.request("GET", "/resolutions");
  }
}

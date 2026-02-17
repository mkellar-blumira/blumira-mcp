const BASE_URL = "https://api.blumira.com/public-api/v1";

export interface BlumiraClientOptions {
  accessToken: string;
}

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
  links?: {
    next?: string;
    previous?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
}

export class BlumiraClient {
  private accessToken: string;

  constructor(options: BlumiraClientOptions) {
    if (!options.accessToken) {
      throw new Error("Blumira access token is required.");
    }
    this.accessToken = options.accessToken;
  }

  private async request<T = Record<string, unknown>>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);

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

    const response = await fetch(url.toString(), init);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Blumira API error ${response.status} ${response.statusText}: ${body}`
      );
    }

    return (await response.json()) as T;
  }

  private async requestAllPages<T = Record<string, unknown>>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T[]> {
    const allItems: T[] = [];
    const pageSize =
      typeof params?.page_size === "number" ? params.page_size : 50;
    let page = 1;

    while (true) {
      const response = await this.request<PaginatedResponse<T>>(
        "GET",
        endpoint,
        { ...params, page, page_size: pageSize }
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
      if (!nextLink || returnedCount === 0) {
        break;
      }

      page += 1;
    }

    return allItems;
  }

  private buildFindingFilters(
    filters?: FindingFilters
  ): Record<string, unknown> {
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
    if (filters.status_modified_by)
      qs.status_modified_by = filters.status_modified_by;
    if (filters.type) qs.type = filters.type;
    return qs;
  }

  // --- Health ---

  async getHealth(): Promise<Record<string, unknown>> {
    return this.request("GET", "/health");
  }

  // --- MSP Accounts ---

  async listAccounts(
    pagination?: PaginationParams,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    if (returnAll) {
      return this.requestAllPages("/msp/accounts", pagination);
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      "/msp/accounts",
      pagination
    );
    return response.data ?? [];
  }

  async getAccount(accountId: string): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/msp/accounts/${accountId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // --- MSP Account Findings ---

  async listAccountFindings(
    accountId: string,
    pagination?: PaginationParams,
    filters?: FindingFilters,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    const params = { ...pagination, ...this.buildFindingFilters(filters) };
    if (returnAll) {
      return this.requestAllPages(
        `/msp/accounts/${accountId}/findings`,
        params
      );
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      `/msp/accounts/${accountId}/findings`,
      params
    );
    return response.data ?? [];
  }

  async listAllAccountsFindings(
    pagination?: PaginationParams,
    filters?: FindingFilters,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    const params = { ...pagination, ...this.buildFindingFilters(filters) };
    if (returnAll) {
      return this.requestAllPages("/msp/accounts/findings", params);
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      "/msp/accounts/findings",
      params
    );
    return response.data ?? [];
  }

  async getAccountFinding(
    accountId: string,
    findingId: string
  ): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/msp/accounts/${accountId}/findings/${findingId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  async getAccountFindingComments(
    accountId: string,
    findingId: string
  ): Promise<Record<string, unknown>[]> {
    const response = await this.request<PaginatedResponse>(
      "GET",
      `/msp/accounts/${accountId}/findings/${findingId}/comments`
    );
    return Array.isArray(response.data)
      ? response.data
      : [response.data ?? response];
  }

  // --- MSP Account Agent Devices ---

  async listAccountAgentDevices(
    accountId: string,
    pagination?: PaginationParams,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    if (returnAll) {
      return this.requestAllPages(
        `/msp/accounts/${accountId}/agents/devices`,
        pagination
      );
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      `/msp/accounts/${accountId}/agents/devices`,
      pagination
    );
    return response.data ?? [];
  }

  async getAccountAgentDevice(
    accountId: string,
    deviceId: string
  ): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/msp/accounts/${accountId}/agents/devices/${deviceId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // --- MSP Account Agent Keys ---

  async listAccountAgentKeys(
    accountId: string,
    pagination?: PaginationParams,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    if (returnAll) {
      return this.requestAllPages(
        `/msp/accounts/${accountId}/agents/keys`,
        pagination
      );
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      `/msp/accounts/${accountId}/agents/keys`,
      pagination
    );
    return response.data ?? [];
  }

  async getAccountAgentKey(
    accountId: string,
    keyId: string
  ): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/msp/accounts/${accountId}/agents/keys/${keyId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // --- Org Agent Devices ---

  async listOrgAgentDevices(
    pagination?: PaginationParams,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    if (returnAll) {
      return this.requestAllPages("/org/agents/devices", pagination);
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      "/org/agents/devices",
      pagination
    );
    return response.data ?? [];
  }

  async getOrgAgentDevice(
    deviceId: string
  ): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/org/agents/devices/${deviceId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // --- Org Agent Keys ---

  async listOrgAgentKeys(
    pagination?: PaginationParams,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    if (returnAll) {
      return this.requestAllPages("/org/agents/keys", pagination);
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      "/org/agents/keys",
      pagination
    );
    return response.data ?? [];
  }

  async getOrgAgentKey(keyId: string): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/org/agents/keys/${keyId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  // --- Org Findings ---

  async listOrgFindings(
    pagination?: PaginationParams,
    filters?: FindingFilters,
    returnAll = false
  ): Promise<Record<string, unknown>[]> {
    const params = { ...pagination, ...this.buildFindingFilters(filters) };
    if (returnAll) {
      return this.requestAllPages("/org/findings", params);
    }
    const response = await this.request<PaginatedResponse>(
      "GET",
      "/org/findings",
      params
    );
    return response.data ?? [];
  }

  async getOrgFinding(
    findingId: string
  ): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/org/findings/${findingId}`
    );
    return response.data ?? (response as Record<string, unknown>);
  }

  async getOrgFindingComments(
    findingId: string
  ): Promise<Record<string, unknown>[]> {
    const response = await this.request<PaginatedResponse>(
      "GET",
      `/org/findings/${findingId}/comments`
    );
    return Array.isArray(response.data)
      ? response.data
      : [response.data ?? response];
  }

  async getOrgFindingDetails(
    findingId: string
  ): Promise<Record<string, unknown>> {
    const response = await this.request<{ data?: Record<string, unknown> }>(
      "GET",
      `/org/findings/${findingId}/details`
    );
    return response.data ?? (response as Record<string, unknown>);
  }
}

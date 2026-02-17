/**
 * Custom error hierarchy for the Blumira MCP server.
 *
 * Provides structured, typed errors that distinguish between different
 * failure modes (auth, network, validation, API) so that tool handlers
 * can surface actionable messages to the LLM.
 */

export class BlumiraError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BlumiraError";
  }
}

export class BlumiraAuthenticationError extends BlumiraError {
  constructor(message = "Authentication failed. Check your BLUMIRA_ACCESS_TOKEN.", options?: ErrorOptions) {
    super(message, options);
    this.name = "BlumiraAuthenticationError";
  }
}

export class BlumiraNetworkError extends BlumiraError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BlumiraNetworkError";
  }
}

export class BlumiraNotFoundError extends BlumiraError {
  constructor(resource: string, id: string, options?: ErrorOptions) {
    super(`${resource} not found: ${id}`, options);
    this.name = "BlumiraNotFoundError";
  }
}

export class BlumiraValidationError extends BlumiraError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BlumiraValidationError";
  }
}

export class BlumiraApiError extends BlumiraError {
  public readonly statusCode: number;
  public readonly responseBody: string;

  constructor(statusCode: number, responseBody: string, options?: ErrorOptions) {
    super(`Blumira API error ${statusCode}: ${responseBody}`, options);
    this.name = "BlumiraApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

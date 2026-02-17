/**
 * Configuration management for the Blumira MCP server.
 *
 * All configuration is loaded from environment variables at startup.
 * The Settings object is validated once and cached for the lifetime
 * of the process — tool functions import `getSettings()` to access it.
 */

import { BlumiraValidationError } from "./errors.js";

export interface Settings {
  /** JWT access token for Blumira API (Bearer auth). */
  accessToken: string;

  /** Base URL for the Blumira public API. */
  baseUrl: string;

  /** Log level for the server (debug | info | warn | error). */
  logLevel: string;
}

let cachedSettings: Settings | null = null;

/**
 * Build and validate settings from environment variables.
 *
 * @returns Validated Settings object.
 * @throws BlumiraValidationError if required env vars are missing.
 */
export function getSettings(): Settings {
  if (cachedSettings) return cachedSettings;

  const accessToken = (process.env.BLUMIRA_ACCESS_TOKEN ?? "").trim();
  if (!accessToken) {
    throw new BlumiraValidationError(
      "BLUMIRA_ACCESS_TOKEN environment variable is required. " +
      "Set it to your Blumira JWT access token."
    );
  }

  const baseUrl = (
    process.env.BLUMIRA_BASE_URL ?? "https://api.blumira.com/public-api/v1"
  ).trim().replace(/\/+$/, "");

  const logLevel = (process.env.BLUMIRA_LOG_LEVEL ?? "info").trim().toLowerCase();

  cachedSettings = { accessToken, baseUrl, logLevel };
  return cachedSettings;
}

/**
 * Redact a secret token for safe logging (shows first 8 chars + "...").
 */
export function redactToken(token: string): string {
  if (token.length <= 12) return "[REDACTED]";
  return token.slice(0, 8) + "...[REDACTED]";
}

/**
 * Structured logger for the Blumira MCP server.
 *
 * Writes JSON-formatted log lines to stderr (stdout is reserved for
 * the MCP stdio transport).  Automatically redacts any registered
 * secret values from log output.
 */

const secrets: string[] = [];

export function registerSecret(secret: string): void {
  if (secret && !secrets.includes(secret)) {
    secrets.push(secret);
  }
}

function redact(text: string): string {
  let result = text;
  for (const secret of secrets) {
    result = result.replaceAll(secret, "[REDACTED]");
  }
  return result;
}

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = "info";

export function setLogLevel(level: string): void {
  const normalized = level.toLowerCase();
  if (normalized in LEVEL_PRIORITY) {
    currentLevel = normalized as LogLevel;
  }
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message: redact(message),
  };

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      entry[key] = typeof value === "string" ? redact(value) : value;
    }
  }

  process.stderr.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => log("debug", msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => log("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => log("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log("error", msg, extra),
};

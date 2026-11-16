import { config } from "@/lib/config";
import { redactDeep, redactText } from "@/server/security/redact";

/**
 * Minimal structured logger with automatic redaction of sensitive values.
 * Every message and metadata value passes through the redaction layer so
 * embed tokens and signed query strings never reach the log output.
 */
type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function activeLevel(): number {
  return LEVEL_ORDER[config.logLevel] ?? LEVEL_ORDER.info;
}

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < activeLevel()) return;
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: redactText(message),
  };
  if (meta && Object.keys(meta).length > 0) {
    payload.meta = redactDeep(meta);
  }
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};

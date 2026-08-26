type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line); // eslint-disable-line no-console
  else if (level === "warn") console.warn(line); // eslint-disable-line no-console
  else console.log(line); // eslint-disable-line no-console
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};

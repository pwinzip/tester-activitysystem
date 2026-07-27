import { env } from "./env";

type Level = "debug" | "info" | "warn" | "error";

const WEIGHT: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// Fields that must never be logged (spec v2 §35).
const REDACT = new Set([
  "password",
  "otp",
  "otpHash",
  "token",
  "sessionToken",
  "secret",
  "smtpPass",
]);

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = REDACT.has(k) ? "[redacted]" : v;
  }
  return out;
}

function emit(level: Level, msg: string, meta: Record<string, unknown> = {}) {
  if (WEIGHT[level] < WEIGHT[env.LOG_LEVEL]) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...sanitize(meta),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};

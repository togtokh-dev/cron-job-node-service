// src/util/logger.ts
// Structured logger — бүх log нэг ижил бүтэцтэй, stdout руу 1 мөр = 1 log.
//
//   import logger from "../util/logger";
//   logger.info("Server started", { port: 3000 });
//   const log = logger.child("scheduler");
//   log.error("job failed", err, { job_id });
//
// Env:
//   LOG_LEVEL   debug | info | warn | error | fatal | silent
//   LOG_FORMAT  json | pretty
import { ENV_TYPE, envStr } from "./secrets";

export const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export type LogLevelSetting = LogLevel | "silent";
export type LogFormat = "json" | "pretty";
export type LogContext = Record<string, unknown>;

export type LogError = {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
};

export type LogRecord = {
  timestamp: string;
  level: LogLevel;
  service: string;
  env: string;
  scope: string;
  message: string;
  context: LogContext | null;
  error: LogError | null;
};

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  fatal(message: string, error?: unknown, context?: LogContext): void;
  child(scope: string): Logger;
}

export type LoggerOptions = {
  service: string;
  env: string;
  level: LogLevelSetting;
  format: LogFormat;
  write?: (line: string) => void;
};

const LEVEL_WEIGHT: Record<LogLevelSetting, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
  silent: 100
};

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  fatal: "\x1b[35m"
};
const RESET = "\x1b[0m";

function isLevelSetting(v: string): v is LogLevelSetting {
  return v in LEVEL_WEIGHT;
}

export function parseLogLevel(raw: string, fallback: LogLevelSetting): LogLevelSetting {
  const v = raw.trim().toLowerCase();
  return isLevelSetting(v) ? v : fallback;
}

export function parseLogFormat(raw: string, fallback: LogFormat): LogFormat {
  const v = raw.trim().toLowerCase();
  return v === "json" || v === "pretty" ? v : fallback;
}

export function serializeError(err: unknown): LogError | null {
  if (err === undefined || err === null) return null;
  if (err instanceof Error) {
    const code = (err as Error & { code?: unknown }).code;
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(typeof code === "string" || typeof code === "number" ? { code } : {})
    };
  }
  if (typeof err === "string") return { name: "Error", message: err };
  try {
    return { name: "NonError", message: JSON.stringify(err) };
  } catch {
    return { name: "NonError", message: Object.prototype.toString.call(err) };
  }
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, v: unknown) => {
    if (typeof v === "bigint") return v.toString();
    if (v instanceof Error) return serializeError(v);
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }
    return v;
  });
}

function formatPretty(r: LogRecord): string {
  const level = `${COLORS[r.level]}${r.level.toUpperCase().padEnd(5)}${RESET}`;
  const ctx = r.context ? ` ${safeStringify(r.context)}` : "";
  const err = r.error
    ? `\n  ${r.error.name}: ${r.error.message}${
        r.error.stack ? `\n${r.error.stack.split("\n").slice(1).join("\n")}` : ""
      }`
    : "";
  return `${r.timestamp} ${level} [${r.scope}] ${r.message}${ctx}${err}`;
}

export function createLogger(options: LoggerOptions, scope = "app"): Logger {
  const threshold = LEVEL_WEIGHT[options.level];
  const write = options.write ?? ((line: string) => process.stdout.write(`${line}\n`));

  const emit = (
    level: LogLevel,
    message: string,
    error: unknown,
    context: LogContext | undefined
  ) => {
    if (LEVEL_WEIGHT[level] < threshold) return;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      service: options.service,
      env: options.env,
      scope,
      message,
      context: context && Object.keys(context).length > 0 ? context : null,
      error: serializeError(error)
    };

    try {
      write(options.format === "pretty" ? formatPretty(record) : safeStringify(record));
    } catch {
      // logger хэзээ ч app-ийг унагахгүй
    }
  };

  return {
    debug: (message, context) => emit("debug", message, undefined, context),
    info: (message, context) => emit("info", message, undefined, context),
    warn: (message, context) => emit("warn", message, undefined, context),
    error: (message, error, context) => emit("error", message, error, context),
    fatal: (message, error, context) => emit("fatal", message, error, context),
    child: (childScope) => createLogger(options, childScope)
  };
}

const defaultLevel: LogLevelSetting =
  ENV_TYPE === "development" ? "debug" : ENV_TYPE === "test" ? "warn" : "info";
const defaultFormat: LogFormat = ENV_TYPE === "development" ? "pretty" : "json";

export const logger = createLogger({
  service: envStr("NAME", "cron-job-backend"),
  env: ENV_TYPE,
  level: parseLogLevel(envStr("LOG_LEVEL"), defaultLevel),
  format: parseLogFormat(envStr("LOG_FORMAT"), defaultFormat)
});

export default logger;

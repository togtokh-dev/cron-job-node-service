// src/config/env.ts
import { ENV_TYPE, envBool, envCsv, envNum, envStr } from "../util/secrets";

export type ServerMode = "dev" | "prod" | "staging" | "test";

function required(name: string, v: string): string {
  if (!v || String(v).trim().length === 0) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

function parseServerMode(raw: string): ServerMode {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "prod" || v === "production") return "prod";
  if (v === "staging") return "staging";
  if (v === "test") return "test";
  return "dev";
}

const serverMode = parseServerMode(envStr("SERVER", "dev"));

export const CONFIG = {
  ENV_TYPE,

  // app
  PORT: envNum("PORT", 2003),
  SERVER: serverMode,
  NAME: envStr("NAME", "cron-job-backend"),

  // routing — public cron API backward-compat-аар ҮРГЭЛЖ /cron-job дор
  DOMAIN_PARAM: envStr("DOMAIN_PARAM", "cron-job"),

  // cors
  ENABLE_CORS: envBool("ENABLE_CORS", true),
  CORS_ORIGINS: envCsv("CORS_ORIGINS"),

  // body limits
  JSON_LIMIT: envStr("JSON_LIMIT", "5mb"),
  URLENCODED_LIMIT: envStr("URLENCODED_LIMIT", "5mb"),

  // rate limit
  RATE_LIMIT_WINDOW_MS: envNum("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  RATE_LIMIT_MAX: envNum("RATE_LIMIT_MAX", 300_000),

  // toggles
  ENABLE_HELMET: envBool("ENABLE_HELMET", true),
  ENABLE_MORGAN: envBool("ENABLE_MORGAN", true),
  ENABLE_RATE_LIMIT: envBool("ENABLE_RATE_LIMIT", true),
  ENABLE_HPP: envBool("ENABLE_HPP", true),
  ENABLE_COMPRESSION: envBool("ENABLE_COMPRESSION", true),

  // monitoring
  NEWRELIC: envBool("NEWRELIC", false),

  // swagger / openapi
  ENABLE_SWAGGER: envBool("ENABLE_SWAGGER", true),
  SWAGGER_PATH: envStr("SWAGGER_PATH", "/docs"),
  SWAGGER_USER: envStr("SWAGGER_USER", ""),
  SWAGGER_PASSWORD: envStr("SWAGGER_PASSWORD", ""),

  // mongo
  MONGODB_URI: envStr("MONGODB_URI", ""),
  MONGODB_dbName: envStr("MONGODB_dbName", ""),

  // --------- Admin нэвтрэлт (panel) ---------
  ADMIN_USERNAME: envStr("ADMIN_USERNAME", "admin"),
  ADMIN_PASSWORD: envStr("ADMIN_PASSWORD", ""),
  ADMIN_PASSWORD_HASH: envStr("ADMIN_PASSWORD_HASH", ""),
  JWT_SECRET: envStr("JWT_SECRET", ""),
  JWT_EXPIRESIN: envStr("JWT_EXPIRESIN", "7d"),

  // --------- Log retention ---------
  LOG_RETENTION_ENABLED: envBool("LOG_RETENTION_ENABLED", true),
  LOG_RETENTION_DAYS: envNum("LOG_RETENTION_DAYS", 30),
  LOG_RETENTION_CRON: envStr("LOG_RETENTION_CRON", "0 3 * * *"),

  // logger
  LOG_LEVEL: envStr("LOG_LEVEL", ""),
  LOG_FORMAT: envStr("LOG_FORMAT", "")
} as const;

export function validateConfig(): void {
  if (CONFIG.SERVER === "prod" || CONFIG.SERVER === "staging") {
    required("MONGODB_URI", CONFIG.MONGODB_URI);
    required("MONGODB_dbName", CONFIG.MONGODB_dbName);
    required("JWT_SECRET", CONFIG.JWT_SECRET);

    // Admin нууц үг заавал (plain эсвэл hash)
    if (!CONFIG.ADMIN_PASSWORD && !CONFIG.ADMIN_PASSWORD_HASH) {
      throw new Error("Missing env: ADMIN_PASSWORD or ADMIN_PASSWORD_HASH");
    }
  }

  if (CONFIG.ENABLE_SWAGGER && CONFIG.SERVER !== "dev") {
    required("SWAGGER_USER", CONFIG.SWAGGER_USER);
    required("SWAGGER_PASSWORD", CONFIG.SWAGGER_PASSWORD);
  }
}

export default CONFIG;

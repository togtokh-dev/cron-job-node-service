// src/util/secrets.ts
// Env файлыг boot үед нэг удаа ачаална + env унших helper-ууд.
import fs from "fs";
import path from "path";

import dotenv from "dotenv";

export type EnvType = "production" | "development" | "staging" | "test";

export const ENV_TYPE: EnvType =
  (process.env.NODE_ENV as EnvType) ||
  (process.env.npm_lifecycle_event as EnvType) ||
  "development";

function envFileByType(type: EnvType) {
  if (type === "production") return ".env.production";
  if (type === "staging") return ".env.staging";
  if (type === "test") return ".env.test";
  return ".env.development";
}

/** Env файлыг boot үед ачаална. Байхгүй бол process.env дээр л ажиллана. */
export function loadEnv() {
  const file = envFileByType(ENV_TYPE);
  const fullPath = path.resolve(__dirname, "../../", file);

  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
    console.log(`[env] loaded ${file}`);
    return;
  }

  console.warn(`[env] ${file} not found (${fullPath}). Using process.env only.`);
}

/** helpers */
export function envStr(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).toString();
}
export function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
export function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}
export function envCsv(name: string): string[] {
  return envStr(name, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

loadEnv();

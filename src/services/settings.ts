// src/services/settings.ts
// Log retention гэх мэт тохиргоог DB-д хадгална. Байхгүй бол env (CONFIG) fallback.
import { CONFIG } from "../config/env";
import { SettingModel } from "../models";

export const SETTING_KEYS = {
  LOG_RETENTION_ENABLED: "LOG_RETENTION_ENABLED",
  LOG_RETENTION_DAYS: "LOG_RETENTION_DAYS"
} as const;

export type RetentionSettings = {
  enabled: boolean;
  days: number;
};

async function getRaw<T>(key: string): Promise<T | undefined> {
  const doc = await SettingModel.findOne({ key }).lean();
  return doc ? (doc.value as T) : undefined;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await SettingModel.updateOne(
    { key },
    { $set: { value } },
    { upsert: true }
  );
}

export async function getRetention(): Promise<RetentionSettings> {
  const enabled = await getRaw<boolean>(SETTING_KEYS.LOG_RETENTION_ENABLED);
  const days = await getRaw<number>(SETTING_KEYS.LOG_RETENTION_DAYS);
  return {
    enabled: typeof enabled === "boolean" ? enabled : CONFIG.LOG_RETENTION_ENABLED,
    days: typeof days === "number" && days > 0 ? days : CONFIG.LOG_RETENTION_DAYS
  };
}

export async function setRetention(patch: Partial<RetentionSettings>): Promise<RetentionSettings> {
  if (typeof patch.enabled === "boolean") {
    await setSetting(SETTING_KEYS.LOG_RETENTION_ENABLED, patch.enabled);
  }
  if (typeof patch.days === "number" && patch.days > 0) {
    await setSetting(SETTING_KEYS.LOG_RETENTION_DAYS, Math.floor(patch.days));
  }
  return getRetention();
}

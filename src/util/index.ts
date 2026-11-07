// src/util/index.ts
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred.";
}

export function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(getErrorMessage(err));
}

/** Урт ялгаанаас үл хамаарч тогтмол хугацаанд мөр харьцуулна */
export function safeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // урт ижил биш ч тогтмол хугацаа барина
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** API key үүсгэх: харагдах prefix + нэг удаа буцаах бүтэн түлхүүр */
export function generateApiKey(prefix = "cj"): {
  key: string;
  hash: string;
  display: string;
} {
  const raw = randomBytes(24).toString("hex"); // 48 тэмдэгт
  const key = `${prefix}_${raw}`;
  return {
    key,
    hash: hashApiKey(key),
    display: `${prefix}_${raw.slice(0, 4)}…${raw.slice(-4)}`
  };
}

/** API key-г DB-д хадгалахдаа hash хэлбэрээр хадгална */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// src/middleware/api-key.ts
// SDK / программаас cron API дуудах x-api-key шалгалт.
//
//   apiKeyOptional — key байвал шалгаад req.apiKey-д тэмдэглэнэ, байхгүй бол
//                    цааш нэвтрүүлнэ (хуучин хэрэглэгчид эвдрэхгүй — backward compat).
//   apiKeyRequired — key заавал шаардана.
import { NextFunction, Request, Response } from "express";

import { ApiKeyModel } from "../models";
import { hashApiKey } from "../util";
import logger from "../util/logger";

const log = logger.child("api-key");

export type ApiKeyInfo = { _id: string; name: string };
export type ApiKeyRequest = Request & { apiKey?: ApiKeyInfo };

function readKey(req: Request): string | null {
  const h = req.headers["x-api-key"];
  if (typeof h === "string" && h.trim()) return h.trim();
  const auth = req.headers.authorization || "";
  const m = /^ApiKey\s+(.+)$/i.exec(auth);
  if (m) return m[1].trim();
  return null;
}

async function resolveKey(req: ApiKeyRequest): Promise<"none" | "invalid" | "ok"> {
  const raw = readKey(req);
  if (!raw) return "none";

  const doc = await ApiKeyModel.findOne({ key_hash: hashApiKey(raw), status: true });
  if (!doc) return "invalid";

  req.apiKey = { _id: String(doc._id), name: doc.name };
  // сүүлд ашигласан хугацааг тэмдэглэнэ (fire-and-forget)
  void ApiKeyModel.updateOne({ _id: doc._id }, { $set: { last_used_at: new Date() } }).catch(
    () => undefined
  );
  return "ok";
}

export const apiKeyOptional = () => (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  void (async () => {
    const r = await resolveKey(req).catch((e) => {
      log.error("api key check failed", e);
      return "none" as const;
    });
    if (r === "invalid") {
      return res
        .status(401)
        .json({ success: false, message: "API key хүчингүй байна", code: "401", data: null });
    }
    return next();
  })();
};

export const apiKeyRequired = () => (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  void (async () => {
    const r = await resolveKey(req).catch((e) => {
      log.error("api key check failed", e);
      return "invalid" as const;
    });
    if (r !== "ok") {
      return res
        .status(401)
        .json({ success: false, message: "API key шаардлагатай", code: "401", data: null });
    }
    return next();
  })();
};

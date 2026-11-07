// src/middleware/admin-auth.ts
// Panel-ийн admin нэвтрэлт — env дэх ганц admin + JWT.
// Бүртгэл / нууц үг сэргээх БАЙХГҮЙ.
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { CONFIG } from "../config/env";
import logger from "../util/logger";

const log = logger.child("admin-auth");

export type AdminPayload = {
  sub: string; // username
  role: "admin";
};

export type AdminRequest = Request & { admin?: AdminPayload; token?: string };

export function signAdminToken(username: string): string {
  if (!CONFIG.JWT_SECRET) {
    throw new Error("JWT_SECRET тохируулаагүй байна");
  }
  return jwt.sign({ sub: username, role: "admin" } as AdminPayload, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRESIN as jwt.SignOptions["expiresIn"]
  });
}

export function deny(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message, code: String(status), data: null });
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (m) return m[1];
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.token;
  if (cookieToken) return cookieToken;
  return null;
}

/** Admin route-уудын JWT middleware */
export const adminAuth = () => (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    if (!CONFIG.JWT_SECRET) return deny(res, 503, "Серверийн нэвтрэлт тохируулаагүй байна");

    const token = extractToken(req);
    if (!token) return deny(res, 401, "Нэвтрэх шаардлагатай");

    const payload = jwt.verify(token, CONFIG.JWT_SECRET) as AdminPayload;
    if (payload.role !== "admin") return deny(res, 403, "Эрх хүрэлцэхгүй байна");

    req.admin = payload;
    req.token = token;
    return next();
  } catch (err) {
    log.warn("token verify failed", { path: req.originalUrl });
    return deny(res, 401, "Token хүчингүй байна");
  }
};

export default adminAuth;

// src/middleware/logger.ts
// Бүх JSON хариуны нэгдсэн ApiResponse төрөл + (сонголтоор) хүсэлтийн логчин.
import { NextFunction, Request, Response } from "express";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  token?: string;
  code: string;
  count?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginate?: Record<string, any>;
  data: T | null;
}

/** Одоогоор pass-through — morgan нь app.ts дээр stdout руу бичнэ. */
export const logMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export default logMiddleware;

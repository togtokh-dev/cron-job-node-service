// src/app.ts
import fs from "fs";
import path from "path";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";

import "./auth/index"; // boot: DB холболт + cron sync (side-effect)
import { allowedHeaders } from "./config";
import { CONFIG } from "./config/env";
import { swaggerRouter } from "./docs/swagger";
import { logMiddleware } from "./middleware/logger";
import routers from "./routes";
import logger from "./util/logger";

logger.info("app starting", { env: CONFIG.ENV_TYPE });

const app: Express = express();
app.set("trust proxy", 1);

/* ---------- Body parsers ---------- */
app.use(express.json({ limit: CONFIG.JSON_LIMIT }));
app.use(express.urlencoded({ limit: CONFIG.URLENCODED_LIMIT, extended: true }));

/* ---------- Security headers ---------- */
if (CONFIG.ENABLE_HELMET) {
  app.use(
    helmet({
      // panel-ийн inline asset-уудад саад болохгүйн тулд CSP-г асаахгүй
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
}

/* ---------- CORS ---------- */
if (CONFIG.ENABLE_CORS) {
  const allowedOrigins = CONFIG.CORS_ORIGINS;
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.length === 0) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders,
      credentials: true
    })
  );
}

/* ---------- HTTP access log → structured logger ---------- */
if (CONFIG.ENABLE_MORGAN && CONFIG.ENV_TYPE !== "test") {
  const httpLog = logger.child("http");
  app.use(
    morgan(
      (tokens, req, res) =>
        JSON.stringify({
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: Number(tokens.status(req, res)) || 0,
          response_time_ms: Number(tokens["response-time"](req, res)) || 0
        }),
      {
        stream: {
          write: (line: string) => {
            try {
              const ctx = JSON.parse(line) as { status: number } & Record<string, unknown>;
              if (ctx.status >= 500) httpLog.error("http request", undefined, ctx);
              else if (ctx.status >= 400) httpLog.warn("http request", ctx);
              else httpLog.info("http request", ctx);
            } catch {
              /* ignore */
            }
          }
        }
      }
    )
  );
}

/* ---------- Hardening ---------- */
if (CONFIG.ENABLE_HPP) app.use(hpp());
if (CONFIG.ENABLE_COMPRESSION) app.use(compression());
app.use(cookieParser());
app.use(logMiddleware);

/* ---------- Swagger docs ---------- */
if (CONFIG.ENABLE_SWAGGER) {
  app.use(
    CONFIG.SWAGGER_PATH,
    swaggerRouter({
      user: CONFIG.SWAGGER_USER,
      password: CONFIG.SWAGGER_PASSWORD,
      title: `${CONFIG.NAME} — API Docs`
    })
  );
  logger.info("swagger enabled", { path: CONFIG.SWAGGER_PATH });
}

/* ---------- API routes ---------- */
app.use(routers);

/* ---------- Admin panel (React build) ---------- */
const PUBLIC_DIR = path.join(__dirname, "../public");
app.use(express.static(PUBLIC_DIR));

// SPA fallback — API биш GET хүсэлтэд index.html буцаана
app.get("*", (req: Request, res: Response, next: NextFunction) => {
  if (
    req.path.startsWith("/cron-job") ||
    req.path.startsWith("/healthcheck") ||
    req.path.startsWith(CONFIG.SWAGGER_PATH)
  ) {
    return next();
  }
  const indexFile = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  return next();
});

/* ---------- 404 (API) ---------- */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Not found", code: "404", data: null });
});

/* ---------- Error handler ---------- */
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error("unhandled request error", err, { method: req.method, path: req.originalUrl });
  const message =
    CONFIG.ENV_TYPE === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error";
  res.status(500).json({ success: false, message, code: "500", data: null });
});

app.set("port", CONFIG.PORT);

export default app;

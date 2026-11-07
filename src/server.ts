// src/server.ts
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";

import IP from "ip";

import app from "./app";
import { CONFIG, validateConfig } from "./config/env";
import logger from "./util/logger";

validateConfig();

const isSSL = CONFIG.SERVER !== "dev" && process.env.SSL === "true";

let server: http.Server | https.Server;

if (isSSL) {
  const keyPath = path.resolve(__dirname, "../ssl/ssl.key");
  const certPath = path.resolve(__dirname, "../ssl/ssl.pem");
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    throw new Error("SSL enabled but certificate files not found");
  }
  server = https.createServer(
    { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
    app
  );
} else {
  server = http.createServer(app);
}

server.listen(CONFIG.PORT, () => {
  const ip = IP.address();
  const protocol = isSSL ? "https" : "http";
  logger.info("server listening", {
    url: `${protocol}://${ip}:${CONFIG.PORT}`,
    port: CONFIG.PORT,
    env: CONFIG.ENV_TYPE
  });
});

const shutdown = (signal: string) => {
  logger.info("shutdown signal received", { signal });
  server.close(() => {
    logger.info("http server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.fatal("force shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.fatal("uncaught exception", err);
});
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled rejection", reason);
});

export default server;

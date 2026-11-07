// src/docs/swagger.ts
// Swagger UI + raw OpenAPI JSON, HTTP Basic auth-аар хамгаалагдсан.
//   GET {SWAGGER_PATH}               → Swagger UI
//   GET {SWAGGER_PATH}/openapi.json  → OpenAPI 3.1 spec
import { timingSafeEqual } from "crypto";

import { NextFunction, Request, Response, Router } from "express";
import swaggerUi from "swagger-ui-express";

import logger from "../util/logger";

import { buildOpenApiSpec } from "./openapi";

const log = logger.child("swagger");

export type SwaggerOptions = {
  user: string;
  password: string;
  title: string;
};

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function basicAuth(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || "";
    const match = /^Basic\s+(.+)$/i.exec(header);

    if (match) {
      const decoded = Buffer.from(match[1], "base64").toString("utf8");
      const sep = decoded.indexOf(":");
      const u = sep >= 0 ? decoded.slice(0, sep) : "";
      const p = sep >= 0 ? decoded.slice(sep + 1) : "";
      const ok = Number(safeEqual(u, user)) & Number(safeEqual(p, password));
      if (ok) return next();
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="API Docs", charset="UTF-8"');
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized", code: "401", data: null });
  };
}

export function swaggerRouter({ user, password, title }: SwaggerOptions): Router {
  const router = Router();

  if (user && password) {
    router.use(basicAuth(user, password));
  } else {
    log.warn("SWAGGER_USER/SWAGGER_PASSWORD хоосон — docs auth-гүй нээлттэй байна");
  }

  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get("/openapi.json", (_req: Request, res: Response) => {
    res.type("application/json").send(JSON.stringify(buildOpenApiSpec()));
  });

  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      customSiteTitle: title,
      swaggerOptions: {
        url: "openapi.json",
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        tryItOutEnabled: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha"
      }
    })
  );

  return router;
}

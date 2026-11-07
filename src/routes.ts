// src/routes.ts
import { Request, Response, Router } from "express";

import apiRouter from "./api/router";

const routers = Router();

// Backward-compat: бүх cron API /cron-job/v1 дор
const cronRouter = Router();
cronRouter.use("/v1", apiRouter);
routers.use("/cron-job", cronRouter);

/**
 * @openapi
 * /healthcheck:
 *   get:
 *     operationId: healthcheck
 *     tags: [System]
 *     summary: Liveness probe
 *     security: []
 *     responses:
 *       "200":
 *         description: Service is up
 */
routers.get("/healthcheck", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

/**
 * @openapi
 * /cron-job/v1/version:
 *   get:
 *     operationId: getVersion
 *     tags: [System]
 *     summary: API version
 *     security: []
 *     responses:
 *       "200":
 *         description: Version
 */
routers.get("/cron-job/version", (_req: Request, res: Response) => {
  res.status(200).send("1.0.0");
});

export default routers;

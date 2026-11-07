// src/api/admin/router.ts
// Panel-ийн бүх admin API. /auth/login-оос бусад нь JWT шаардана.
import { Router } from "express";

import adminAuth from "../../middleware/admin-auth";

import apiKeysRouter from "./apikeys/router";
import authRouter from "./auth/router";
import jobsRouter from "./jobs/router";
import logsRouter from "./logs/router";
import settingsRouter from "./settings/router";

const router = Router();

// login нээлттэй; /auth/me дотроо adminAuth-тай
router.use("/auth", authRouter);

// Бусад бүгд JWT шаардана
router.use("/jobs", adminAuth(), jobsRouter);
router.use("/api-keys", adminAuth(), apiKeysRouter);
router.use("/logs", adminAuth(), logsRouter);
router.use("/settings", adminAuth(), settingsRouter);

export default router;

// src/api/router.ts
import { Router } from "express";

import adminRouter from "./admin/router";
import publicRouter from "./public/router";

const router = Router();

// Admin panel API (эхэнд — /:id-д баригдахаас сэргийлнэ)
router.use("/admin", adminRouter);

// Backward-compatible нийтийн API (хуучин SDK)
router.use("/", publicRouter);

export default router;

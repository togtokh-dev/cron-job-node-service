// src/api/public/router.ts
// Backward-compatible нийтийн API. Бүх зам /cron-job/v1 дор.
import { Router } from "express";

import { apiKeyOptional } from "../../middleware/api-key";

import { create, getall, getone, list_create, remove, update } from "./controller";

const router = Router();

// Бичих үйлдлүүдэд API key заавал биш (нэмэлт шалгалт)
router.post("/list", apiKeyOptional(), list_create);
router.post("/", apiKeyOptional(), create);
router.put("/:id", apiKeyOptional(), update);
router.delete("/:id", apiKeyOptional(), remove);
router.get("/", getall);
router.get("/:id", getone);

export default router;

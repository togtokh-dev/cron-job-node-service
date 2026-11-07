// src/api/admin/logs/router.ts
import { Router } from "express";

import { deleteFiltered, getOne, list } from "./controller";

const router = Router();

router.get("/", list);
router.delete("/", deleteFiltered);
router.get("/:id", getOne);

export default router;

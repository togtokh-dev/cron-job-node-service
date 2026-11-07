// src/api/admin/apikeys/router.ts
import { Router } from "express";

import { create, list, revoke } from "./controller";

const router = Router();

router.get("/", list);
router.post("/", create);
router.delete("/:id", revoke);

export default router;

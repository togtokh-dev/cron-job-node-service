// src/api/admin/settings/router.ts
import { Router } from "express";

import { deleteWorkspace, get, updateRetention } from "./controller";

const router = Router();

router.get("/", get);
router.put("/retention", updateRetention);
router.delete("/workspace", deleteWorkspace);

export default router;

// src/api/admin/jobs/router.ts
import { Router } from "express";

import {
  clearLogs,
  create,
  getOne,
  list,
  remove,
  start,
  stop,
  toggleLog,
  update
} from "./controller";

const router = Router();

router.get("/", list);
router.post("/", create);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/:id/start", start);
router.post("/:id/stop", stop);
router.post("/:id/log", toggleLog);
router.delete("/:id/logs", clearLogs);

export default router;

// src/api/admin/auth/router.ts
import { Router } from "express";

import adminAuth from "../../../middleware/admin-auth";

import { login, me } from "./controller";

const router = Router();

router.post("/login", login);
router.get("/me", adminAuth(), me);

export default router;

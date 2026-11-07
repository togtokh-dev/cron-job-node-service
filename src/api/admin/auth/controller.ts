// src/api/admin/auth/controller.ts
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import Joi from "joi";

import { CONFIG } from "../../../config/env";
import { AdminRequest, signAdminToken } from "../../../middleware/admin-auth";
import { getErrorMessage, safeStrEqual } from "../../../util";
import logger from "../../../util/logger";

const log = logger.child("admin");

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

function passwordMatches(input: string): boolean {
  if (CONFIG.ADMIN_PASSWORD_HASH) {
    try {
      return bcrypt.compareSync(input, CONFIG.ADMIN_PASSWORD_HASH);
    } catch {
      return false;
    }
  }
  if (CONFIG.ADMIN_PASSWORD) {
    return safeStrEqual(input, CONFIG.ADMIN_PASSWORD);
  }
  return false;
}

/**
 * @openapi
 * /cron-job/v1/admin/auth/login:
 *   post:
 *     operationId: adminLogin
 *     tags: [Admin Auth]
 *     summary: Admin нэвтрэх (env admin + JWT)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       "200":
 *         description: Token
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiResponse"
 *                 - type: object
 *                   properties:
 *                     token: { type: string }
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
export const login = async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message, code: "400", data: null });
  }

  const { username, password } = value as { username: string; password: string };

  const userOk = safeStrEqual(username, CONFIG.ADMIN_USERNAME);
  const passOk = passwordMatches(password);

  // && биш — хоёуланг нь үргэлж шалгаж timing ялгааг багасгана
  if (!(userOk && passOk)) {
    log.warn("admin login failed", { username });
    return res
      .status(401)
      .json({ success: false, message: "Нэр эсвэл нууц үг буруу", code: "401", data: null });
  }

  try {
    const token = signAdminToken(username);
    log.info("admin login success", { username });
    return res.status(200).json({
      success: true,
      message: "Success",
      code: "200",
      token,
      data: { username, role: "admin" }
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: getErrorMessage(err), code: "500", data: null });
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/auth/me:
 *   get:
 *     operationId: adminMe
 *     tags: [Admin Auth]
 *     summary: Нэвтэрсэн admin мэдээлэл (session сэргээх)
 *     security:
 *       - adminBearer: []
 *     responses:
 *       "200":
 *         description: Admin
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
export const me = async (req: AdminRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Success",
    code: "200",
    token: req.token || "",
    data: { username: req.admin?.sub, role: req.admin?.role }
  });
};

// src/api/admin/settings/controller.ts
import { Request, Response } from "express";
import Joi from "joi";

import { ApiKeyModel, JobLogModel, JobModel } from "../../../models";
import { stopAllJobs } from "../../../scheduler";
import { getRetention, setRetention } from "../../../services/settings";
import { getErrorMessage } from "../../../util";

const fail = (res: Response, error: unknown, code = 400) =>
  res.status(code).json({ success: false, message: getErrorMessage(error), code: String(code), data: null });

const ok = (res: Response, data: unknown, message = "Success") =>
  res.status(200).json({ success: true, message, code: "200", data });

/**
 * @openapi
 * /cron-job/v1/admin/settings:
 *   get:
 *     operationId: adminSettingsGet
 *     tags: [Settings]
 *     summary: Тохиргоо + ерөнхий тоо хэмжээ
 *     security: [{ adminBearer: [] }]
 *     responses:
 *       "200": { description: Тохиргоо, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const get = async (_req: Request, res: Response) => {
  try {
    const retention = await getRetention();
    const [jobs, activeJobs, logs, apiKeys] = await Promise.all([
      JobModel.countDocuments({}),
      JobModel.countDocuments({ status: true }),
      JobLogModel.countDocuments({}),
      ApiKeyModel.countDocuments({})
    ]);
    return ok(res, { retention, stats: { jobs, activeJobs, logs, apiKeys } });
  } catch (e) {
    return fail(res, e, 500);
  }
};

const retentionSchema = Joi.object({
  enabled: Joi.boolean(),
  days: Joi.number().integer().min(1).max(3650)
}).min(1);

/**
 * @openapi
 * /cron-job/v1/admin/settings/retention:
 *   put:
 *     operationId: adminSettingsRetention
 *     tags: [Settings]
 *     summary: Log retention тохиргоо (автомат устгах)
 *     security: [{ adminBearer: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { enabled: { type: boolean }, days: { type: integer } } } } } }
 *     responses:
 *       "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "400": { $ref: "#/components/responses/BadRequest" }
 */
export const updateRetention = async (req: Request, res: Response) => {
  const { error, value } = retentionSchema.validate(req.body);
  if (error) return fail(res, error.details[0].message, 400);
  try {
    const retention = await setRetention(value);
    return ok(res, { retention });
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/settings/workspace:
 *   delete:
 *     operationId: adminWorkspaceDelete
 *     tags: [Settings]
 *     summary: Workspace устгах — бүх ажил, log, API key-г арилгана
 *     security: [{ adminBearer: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [confirm], properties: { confirm: { type: boolean } } } } } }
 *     responses:
 *       "200": { description: Арилгагдсан, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "400": { $ref: "#/components/responses/BadRequest" }
 */
export const deleteWorkspace = async (req: Request, res: Response) => {
  const confirm = Boolean((req.body as { confirm?: boolean })?.confirm);
  if (!confirm) return fail(res, "Баталгаажуулалт шаардлагатай (confirm=true)", 400);
  try {
    // Бүх идэвхтэй cron task-уудыг зогсооно
    stopAllJobs();

    const [jobs, logs, keys] = await Promise.all([
      JobModel.deleteMany({}),
      JobLogModel.deleteMany({}),
      ApiKeyModel.deleteMany({})
    ]);

    return ok(res, {
      jobs: jobs.deletedCount ?? 0,
      logs: logs.deletedCount ?? 0,
      api_keys: keys.deletedCount ?? 0
    });
  } catch (e) {
    return fail(res, e, 500);
  }
};

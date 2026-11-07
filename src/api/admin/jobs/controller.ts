// src/api/admin/jobs/controller.ts
import { Request, Response } from "express";
import Joi from "joi";

import { JobLogModel, JobModel } from "../../../models";
import { JOB_ENVS } from "../../../models/job-list";
import { scheduleJob, stopJob } from "../../../scheduler";
import { getErrorMessage } from "../../../util";

const fail = (res: Response, error: unknown, code = 400) =>
  res.status(code).json({ success: false, message: getErrorMessage(error), code: String(code), data: null });

const ok = (res: Response, data: unknown, extra: Record<string, unknown> = {}) =>
  res.status(200).json({ success: true, message: "Success", code: "200", data, ...extra });

const createSchema = Joi.object({
  id: Joi.string().required(),
  config: Joi.any().required(),
  job_time: Joi.string().required(),
  status: Joi.boolean().default(true),
  type_name: Joi.string().valid(...JOB_ENVS).required(),
  log_enabled: Joi.boolean().default(false)
});

const updateSchema = Joi.object({
  config: Joi.any(),
  job_time: Joi.string(),
  status: Joi.boolean(),
  type_name: Joi.string().valid(...JOB_ENVS),
  log_enabled: Joi.boolean()
}).min(1);

/**
 * @openapi
 * /cron-job/v1/admin/jobs:
 *   get:
 *     operationId: adminJobsList
 *     tags: [Jobs]
 *     summary: Ажлуудын жагсаалт (orchin/төлвөөр шүүх)
 *     security: [{ adminBearer: [] }]
 *     parameters:
 *       - { name: type_name, in: query, schema: { type: string, enum: [prod, staging, test, dev] } }
 *       - { name: status, in: query, schema: { type: boolean } }
 *       - { name: q, in: query, schema: { type: string } }
 *     responses:
 *       "200": { description: Жагсаалт, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const list = async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    const { type_name, status, q } = req.query;
    if (typeof type_name === "string" && JOB_ENVS.includes(type_name as never)) {
      filter.type_name = type_name;
    }
    if (status === "true" || status === "false") filter.status = status === "true";
    if (typeof q === "string" && q.trim()) filter.id = { $regex: q.trim(), $options: "i" };

    const jobs = await JobModel.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, jobs, { count: jobs.length });
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}:
 *   get:
 *     operationId: adminJobGet
 *     tags: [Jobs]
 *     summary: Ажлын дэлгэрэнгүй + сүүлийн log-ууд
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: Ажил, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "404": { $ref: "#/components/responses/NotFound" }
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const job = await JobModel.findOne({ id: req.params.id }).lean();
    if (!job) return fail(res, "Олдсонгүй", 404);
    const recent_logs = await JobLogModel.find({ job_id: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return ok(res, { ...job, recent_logs });
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/jobs:
 *   post:
 *     operationId: adminJobCreate
 *     tags: [Jobs]
 *     summary: Шинэ ажил үүсгэх
 *     security: [{ adminBearer: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/Job" } } } }
 *     responses:
 *       "200": { description: Үүссэн, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "400": { $ref: "#/components/responses/BadRequest" }
 */
export const create = async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return fail(res, error.details[0].message, 400);
  try {
    const exists = await JobModel.findOne({ id: value.id });
    if (exists) return fail(res, "Ийм id-тай ажил бүртгэлтэй байна", 400);

    const job = await JobModel.create(value);
    if (job.status) scheduleJob(job.id, job.job_time);
    return ok(res, job);
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}:
 *   put:
 *     operationId: adminJobUpdate
 *     tags: [Jobs]
 *     summary: Ажил засах
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/Job" } } } }
 *     responses:
 *       "200": { description: Шинэчлэгдсэн, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "404": { $ref: "#/components/responses/NotFound" }
 */
export const update = async (req: Request, res: Response) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return fail(res, error.details[0].message, 400);
  try {
    const job = await JobModel.findOne({ id: req.params.id });
    if (!job) return fail(res, "Олдсонгүй", 404);

    Object.assign(job, value);
    await job.save();

    if (job.status) scheduleJob(job.id, job.job_time);
    else stopJob(job.id);

    return ok(res, job);
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}:
 *   delete:
 *     operationId: adminJobDelete
 *     tags: [Jobs]
 *     summary: Ажлыг бүрмөсөн устгах (log-уудын хамт)
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: Устгагдсан, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "404": { $ref: "#/components/responses/NotFound" }
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const job = await JobModel.findOne({ id });
    if (!job) return fail(res, "Олдсонгүй", 404);
    stopJob(id);
    await JobModel.deleteOne({ id });
    await JobLogModel.deleteMany({ job_id: id });
    return ok(res, null);
  } catch (e) {
    return fail(res, e, 500);
  }
};

const setStatus = (nextStatus: boolean) => async (req: Request, res: Response) => {
  try {
    const job = await JobModel.findOne({ id: req.params.id });
    if (!job) return fail(res, "Олдсонгүй", 404);
    job.status = nextStatus;
    await job.save();
    if (nextStatus) scheduleJob(job.id, job.job_time);
    else stopJob(job.id);
    return ok(res, job);
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}/start:
 *   post:
 *     operationId: adminJobStart
 *     tags: [Jobs]
 *     summary: Ажил эхлүүлэх
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const start = setStatus(true);

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}/stop:
 *   post:
 *     operationId: adminJobStop
 *     tags: [Jobs]
 *     summary: Ажил зогсоох
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const stop = setStatus(false);

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}/log:
 *   post:
 *     operationId: adminJobToggleLog
 *     tags: [Jobs]
 *     summary: Log бичилт асаах/унтраах
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { enabled: { type: boolean } } } } } }
 *     responses:
 *       "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const toggleLog = async (req: Request, res: Response) => {
  try {
    const enabled = Boolean((req.body as { enabled?: boolean })?.enabled);
    const job = await JobModel.findOne({ id: req.params.id });
    if (!job) return fail(res, "Олдсонгүй", 404);
    job.log_enabled = enabled;
    await job.save();
    return ok(res, job);
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/jobs/{id}/logs:
 *   delete:
 *     operationId: adminJobClearLogs
 *     tags: [Jobs]
 *     summary: Энэ ажлын бүх log-ийг цэвэрлэх
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const clearLogs = async (req: Request, res: Response) => {
  try {
    const r = await JobLogModel.deleteMany({ job_id: req.params.id });
    return ok(res, { deleted: r.deletedCount ?? 0 });
  } catch (e) {
    return fail(res, e, 500);
  }
};

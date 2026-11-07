// src/api/public/controller.ts
// Backward-compatible нийтийн API — хуучин cron-job-node SDK энд хандана.
// Зан төлөв хуучинтай ижил; нэмэлтээр log_enabled талбарыг хадгална.
import { Request, Response } from "express";
import Joi from "joi";

import { JobModel } from "../../models";
import { JOB_ENVS } from "../../models/job-list";
import { scheduleJob, stopJob } from "../../scheduler";
import { getErrorMessage } from "../../util";

const jobShape = {
  id: Joi.string().required(),
  config: Joi.any().required(),
  job_time: Joi.string().required(),
  status: Joi.boolean().required(),
  type_name: Joi.string()
    .valid(...JOB_ENVS)
    .required(),
  // нэмэлт, заавал биш — хуучин SDK илгээхгүй
  log_enabled: Joi.boolean().optional()
};

const listSchema = Joi.array().items(Joi.object(jobShape));
const jobSchema = Joi.object(jobShape);

type JobInput = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  job_time: string;
  status: boolean;
  type_name: (typeof JOB_ENVS)[number];
  log_enabled?: boolean;
};

/** Нэг ажлыг upsert хийгээд хуваарьт нийцүүлнэ */
async function upsertJob(input: JobInput) {
  const existing = await JobModel.findOne({ id: input.id });

  if (existing) {
    existing.config = input.config;
    existing.job_time = input.job_time;
    existing.status = input.status;
    existing.type_name = input.type_name;
    if (typeof input.log_enabled === "boolean") existing.log_enabled = input.log_enabled;
    await existing.save();

    if (input.status) scheduleJob(existing.id, existing.job_time);
    else stopJob(existing.id);

    return existing;
  }

  const created = await JobModel.create({
    id: input.id,
    config: input.config,
    job_time: input.job_time,
    status: input.status,
    type_name: input.type_name,
    log_enabled: input.log_enabled ?? false
  });

  if (created.status) scheduleJob(created.id, created.job_time);
  return created;
}

/**
 * @openapi
 * /cron-job/v1/list:
 *   post:
 *     operationId: publicListUpsert
 *     tags: [Public]
 *     summary: Ажлуудыг бөөнөөр бүртгэх/шинэчлэх (SDK)
 *     description: Хуучин cron-job-node SDK-тай бүрэн нийцтэй. API key заавал биш (нэмэлт).
 *     security:
 *       - apiKey: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { $ref: "#/components/schemas/Job" }
 *     responses:
 *       "200":
 *         description: Амжилттай
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
export const list_create = async (req: Request, res: Response) => {
  const { error, value } = listSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message, code: "400", data: null });
  }

  const list = value as JobInput[];
  try {
    for (const item of list) {
      try {
        await upsertJob(item);
      } catch {
        /* нэг ажил бүтэлгүйтсэн ч бусдыг үргэлжлүүлнэ */
      }
    }
    return res.status(200).json({ success: true, message: "success", code: "200", data: null });
  } catch (error) {
    return res.status(200).json({ success: false, message: getErrorMessage(error), code: "500", data: null });
  }
};

/**
 * @openapi
 * /cron-job/v1/:
 *   post:
 *     operationId: publicCreateJob
 *     tags: [Public]
 *     summary: Нэг ажил бүртгэх/шинэчлэх
 *     security:
 *       - apiKey: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/Job" }
 *     responses:
 *       "200":
 *         description: Амжилттай
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
export const create = async (req: Request, res: Response) => {
  const { error, value } = jobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message, code: "400", data: null });
  }
  try {
    const job = await upsertJob(value as JobInput);
    return res.status(200).json({ success: true, message: "success", code: "200", data: job });
  } catch (error) {
    return res.status(200).json({ success: false, message: getErrorMessage(error), code: "500", data: null });
  }
};

/**
 * @openapi
 * /cron-job/v1/{id}:
 *   put:
 *     operationId: publicUpdateJob
 *     tags: [Public]
 *     summary: Ажил шинэчлэх
 *     security:
 *       - apiKey: []
 *       - {}
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/Job" }
 *     responses:
 *       "200":
 *         description: Амжилттай
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 */
export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config, job_time, status, type_name, log_enabled } = req.body as any;
  try {
    const existing = await JobModel.findOne({ id });
    if (!existing) {
      return res.status(200).json({ success: false, message: "not found", code: "404", data: null });
    }
    if (config !== undefined) existing.config = config;
    if (job_time !== undefined) existing.job_time = job_time;
    if (typeof status === "boolean") existing.status = status;
    if (type_name !== undefined) existing.type_name = type_name;
    if (typeof log_enabled === "boolean") existing.log_enabled = log_enabled;
    await existing.save();

    if (existing.status) scheduleJob(existing.id, existing.job_time);
    else stopJob(existing.id);

    return res.status(200).json({ success: true, message: "success", code: "200", data: existing });
  } catch (error) {
    return res.status(200).json({ success: false, message: getErrorMessage(error), code: "500", data: null });
  }
};

/**
 * @openapi
 * /cron-job/v1/{id}:
 *   delete:
 *     operationId: publicRemoveJob
 *     tags: [Public]
 *     summary: Ажил зогсоох (status=false)
 *     security:
 *       - apiKey: []
 *       - {}
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       "200":
 *         description: Амжилттай
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 */
export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await JobModel.findOne({ id });
    if (!existing) {
      return res.status(200).json({ success: false, message: "not found", code: "404", data: null });
    }
    existing.status = false;
    await existing.save();
    stopJob(existing.id);
    return res.status(200).json({ success: true, message: "Success", code: "200", data: existing });
  } catch (error) {
    return res.status(200).json({ success: false, message: getErrorMessage(error), code: "500", data: null });
  }
};

/**
 * @openapi
 * /cron-job/v1/:
 *   get:
 *     operationId: publicGetAll
 *     tags: [Public]
 *     summary: Бүх ажлын жагсаалт
 *     security:
 *       - apiKey: []
 *       - {}
 *     responses:
 *       "200":
 *         description: Жагсаалт
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 */
export const getall = async (_req: Request, res: Response) => {
  try {
    const results = await JobModel.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, message: "Success", code: "200", data: results });
  } catch (error) {
    return res.status(200).json({ success: false, message: getErrorMessage(error), code: "500", data: null });
  }
};

/**
 * @openapi
 * /cron-job/v1/{id}:
 *   get:
 *     operationId: publicGetOne
 *     tags: [Public]
 *     summary: Нэг ажил
 *     security:
 *       - apiKey: []
 *       - {}
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       "200":
 *         description: Ажил
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiResponse" }
 */
export const getone = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await JobModel.findOne({ id }).lean();
    return res.status(200).json({ success: true, message: "Success", code: "200", data: result });
  } catch (error) {
    return res.status(200).json({ success: false, message: getErrorMessage(error), code: "500", data: null });
  }
};

// src/api/admin/logs/controller.ts
import { Request, Response } from "express";

import { JobLogModel } from "../../../models";
import { JOB_ENVS } from "../../../models/job-list";
import { LOG_STATUSES } from "../../../models/job-log";
import { getErrorMessage } from "../../../util";

const fail = (res: Response, error: unknown, code = 400) =>
  res.status(code).json({ success: false, message: getErrorMessage(error), code: String(code), data: null });

/** Query-ээс log шүүлтүүр үүсгэнэ (list + delete хоёулаа ашиглана) */
function buildFilter(q: Request["query"]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  const { type_name, status, job_id, from, to } = q;

  if (typeof type_name === "string" && JOB_ENVS.includes(type_name as never)) {
    filter.type_name = type_name;
  }
  if (typeof status === "string" && LOG_STATUSES.includes(status as never)) {
    filter.status = status;
  }
  if (typeof job_id === "string" && job_id.trim()) filter.job_id = job_id.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createdAt: Record<string, any> = {};
  if (typeof from === "string" && from) createdAt.$gte = new Date(from);
  if (typeof to === "string" && to) createdAt.$lte = new Date(to);
  if (Object.keys(createdAt).length) filter.createdAt = createdAt;

  return filter;
}

/**
 * @openapi
 * /cron-job/v1/admin/logs:
 *   get:
 *     operationId: adminLogsList
 *     tags: [Logs]
 *     summary: Log жагсаалт (шүүх + pagination)
 *     security: [{ adminBearer: [] }]
 *     parameters:
 *       - { name: type_name, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string, enum: [success, error] } }
 *       - { name: job_id, in: query, schema: { type: string } }
 *       - { name: from, in: query, schema: { type: string, format: date-time } }
 *       - { name: to, in: query, schema: { type: string, format: date-time } }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 50 } }
 *     responses:
 *       "200": { description: Жагсаалт, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const list = async (req: Request, res: Response) => {
  try {
    const filter = buildFilter(req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      JobLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobLogModel.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: "Success",
      code: "200",
      count: total,
      paginate: { total, page, limit, pageCount: Math.ceil(total / limit) },
      data
    });
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/logs/{id}:
 *   get:
 *     operationId: adminLogGet
 *     tags: [Logs]
 *     summary: Нэг log-ийн дэлгэрэнгүй
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: Log, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "404": { $ref: "#/components/responses/NotFound" }
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const doc = await JobLogModel.findById(req.params.id).lean();
    if (!doc) return fail(res, "Олдсонгүй", 404);
    return res.status(200).json({ success: true, message: "Success", code: "200", data: doc });
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/logs:
 *   delete:
 *     operationId: adminLogsDeleteFiltered
 *     tags: [Logs]
 *     summary: Шүүсэн log-уудыг устгах
 *     security: [{ adminBearer: [] }]
 *     parameters:
 *       - { name: type_name, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string } }
 *       - { name: job_id, in: query, schema: { type: string } }
 *       - { name: from, in: query, schema: { type: string } }
 *       - { name: to, in: query, schema: { type: string } }
 *     responses:
 *       "200": { description: Устгагдсан, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const deleteFiltered = async (req: Request, res: Response) => {
  try {
    const filter = buildFilter(req.query);
    const r = await JobLogModel.deleteMany(filter);
    return res
      .status(200)
      .json({ success: true, message: "Success", code: "200", data: { deleted: r.deletedCount ?? 0 } });
  } catch (e) {
    return fail(res, e, 500);
  }
};

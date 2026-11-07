// src/api/admin/apikeys/controller.ts
import { Request, Response } from "express";
import Joi from "joi";

import { ApiKeyModel } from "../../../models";
import { generateApiKey, getErrorMessage } from "../../../util";

const fail = (res: Response, error: unknown, code = 400) =>
  res.status(code).json({ success: false, message: getErrorMessage(error), code: String(code), data: null });

const ok = (res: Response, data: unknown, message = "Success") =>
  res.status(200).json({ success: true, message, code: "200", data });

const createSchema = Joi.object({ name: Joi.string().min(1).max(100).required() });

/**
 * @openapi
 * /cron-job/v1/admin/api-keys:
 *   get:
 *     operationId: adminApiKeysList
 *     tags: [API Keys]
 *     summary: API key-үүдийн жагсаалт
 *     security: [{ adminBearer: [] }]
 *     responses:
 *       "200": { description: Жагсаалт, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 */
export const list = async (_req: Request, res: Response) => {
  try {
    const keys = await ApiKeyModel.find({}, { key_hash: 0 }).sort({ createdAt: -1 }).lean();
    return ok(res, keys);
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/api-keys:
 *   post:
 *     operationId: adminApiKeyCreate
 *     tags: [API Keys]
 *     summary: API key үүсгэх (бүтэн түлхүүр нэг л удаа буцна)
 *     security: [{ adminBearer: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [name], properties: { name: { type: string } } } } } }
 *     responses:
 *       "200": { description: Үүссэн, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "400": { $ref: "#/components/responses/BadRequest" }
 */
export const create = async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return fail(res, error.details[0].message, 400);
  try {
    const { key, hash, display } = generateApiKey();
    const doc = await ApiKeyModel.create({ name: value.name, key_hash: hash, display });
    // key-г зөвхөн энэ хариуд л буцаана — дахин харуулахгүй
    return ok(
      res,
      {
        _id: doc._id,
        name: doc.name,
        display: doc.display,
        status: doc.status,
        createdAt: doc.createdAt,
        key
      },
      "API key үүслээ. Түлхүүрийг одоо хуулж авна уу — дахин харагдахгүй."
    );
  } catch (e) {
    return fail(res, e, 500);
  }
};

/**
 * @openapi
 * /cron-job/v1/admin/api-keys/{id}:
 *   delete:
 *     operationId: adminApiKeyRevoke
 *     tags: [API Keys]
 *     summary: API key устгах (хүчингүй болгох)
 *     security: [{ adminBearer: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses:
 *       "200": { description: Устгагдсан, content: { application/json: { schema: { $ref: "#/components/schemas/ApiResponse" } } } }
 *       "404": { $ref: "#/components/responses/NotFound" }
 */
export const revoke = async (req: Request, res: Response) => {
  try {
    const r = await ApiKeyModel.deleteOne({ _id: req.params.id });
    if (!r.deletedCount) return fail(res, "Олдсонгүй", 404);
    return ok(res, null);
  } catch (e) {
    return fail(res, e, 500);
  }
};

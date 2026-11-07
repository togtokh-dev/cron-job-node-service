// src/models/api-key.ts
// SDK / программаас cron API дуудах түлхүүр. Бодит түлхүүрийг hash хэлбэрээр
// хадгална — үүсгэх үед нэг л удаа buцаана.
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ApiKeyDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  /** sha256(key) */
  key_hash: string;
  /** Жагсаалтад харуулах богино хэлбэр: cj_ab12…cd34 */
  display: string;
  status: boolean;
  last_used_at: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ApiKeySchema = new Schema<ApiKeyDoc>(
  {
    name: { type: String, required: true },
    key_hash: { type: String, required: true, unique: true, index: true },
    display: { type: String, required: true },
    status: { type: Boolean, default: true, index: true },
    last_used_at: { type: Date, default: null }
  },
  { timestamps: true }
);

const modelName = "api-key";

export const ApiKeyModel: Model<ApiKeyDoc> =
  (mongoose.models[modelName] as Model<ApiKeyDoc> | undefined) ||
  mongoose.model<ApiKeyDoc>(modelName, ApiKeySchema);

export default ApiKeyModel;

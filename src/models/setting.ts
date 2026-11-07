// src/models/setting.ts
// Энгийн key/value тохиргооны сан (log retention гэх мэт).
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface SettingDoc extends Document {
  _id: Types.ObjectId;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingSchema = new Schema<SettingDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

const modelName = "setting";

export const SettingModel: Model<SettingDoc> =
  (mongoose.models[modelName] as Model<SettingDoc> | undefined) ||
  mongoose.model<SettingDoc>(modelName, SettingSchema);

export default SettingModel;

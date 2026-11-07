// src/models/job-list.ts
import mongoose, { Document, HydratedDocument, Model, Schema, Types } from "mongoose";

export const JOB_ENVS = ["prod", "staging", "test", "dev"] as const;
export type JobEnvT = (typeof JOB_ENVS)[number];

export interface JobDoc extends Document {
  _id: Types.ObjectId;
  /** Хэрэглэгчийн өгсөн давтагдашгүй id (SDK-аас ирдэг) */
  id: string;
  type_name: JobEnvT;
  job_time: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  status: boolean;
  /** Энэ ажлын гүйцэтгэлийн log бичих эсэх */
  log_enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type JobDocument = HydratedDocument<JobDoc>;

const JobSchema = new Schema<JobDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type_name: { type: String, enum: JOB_ENVS, required: true, index: true },
    job_time: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    status: { type: Boolean, default: true, index: true },
    log_enabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const modelName = "job-list";

export const JobModel: Model<JobDoc> =
  (mongoose.models[modelName] as Model<JobDoc> | undefined) ||
  mongoose.model<JobDoc>(modelName, JobSchema);

export default JobModel;

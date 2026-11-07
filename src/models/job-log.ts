// src/models/job-log.ts
// Ажил ажиллах бүрийн гүйцэтгэлийн бичлэг (log_enabled=true үед).
import mongoose, { Document, Model, Schema, Types } from "mongoose";

import { JOB_ENVS, JobEnvT } from "./job-list";

export const LOG_STATUSES = ["success", "error"] as const;
export type LogStatusT = (typeof LOG_STATUSES)[number];

export interface JobLogDoc extends Document {
  _id: Types.ObjectId;
  job_id: string;
  type_name: JobEnvT;
  status: LogStatusT;
  http_code: number | null;
  duration_ms: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request_config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response_body: any;
  error_message: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const JobLogSchema = new Schema<JobLogDoc>(
  {
    job_id: { type: String, required: true, index: true },
    type_name: { type: String, enum: JOB_ENVS, required: true, index: true },
    status: { type: String, enum: LOG_STATUSES, required: true, index: true },
    http_code: { type: Number, default: null },
    duration_ms: { type: Number, default: 0 },
    request_config: { type: Schema.Types.Mixed, default: null },
    response_body: { type: Schema.Types.Mixed, default: null },
    error_message: { type: String, default: null }
  },
  { timestamps: true }
);

// Retention / жагсаалтын query-д
JobLogSchema.index({ createdAt: -1 });

const modelName = "job-log";

export const JobLogModel: Model<JobLogDoc> =
  (mongoose.models[modelName] as Model<JobLogDoc> | undefined) ||
  mongoose.model<JobLogDoc>(modelName, JobLogSchema);

export default JobLogModel;

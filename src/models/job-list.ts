import mongoose from "mongoose";
import { Types } from "mongoose";
export type DocType = {
  _id?: Types.ObjectId;
  id?: string;
  type_name?: "prod" | "staging" | "dev";
  job_time?: string;
  config?: JSON;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
export interface SchemaDoc extends mongoose.Document {
  id: string;
  type_name: "prod" | "staging" | "dev";
  job_time: string;
  config: JSON;
  status: boolean;
}
const schema = new mongoose.Schema<SchemaDoc>(
  {
    id: { type: String, required: true, unique: true },
    type_name: {
      type: String,
      enum: ["prod", "staging", "dev"],
      required: true,
    },
    job_time: String,
    config: JSON,
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const model = mongoose.model<SchemaDoc>("job-list", schema)<DocType>;
export default model;

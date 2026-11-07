// src/models/index.ts
import { ApiKeyModel } from "./api-key";
import { JobModel } from "./job-list";
import { JobLogModel } from "./job-log";
import { SettingModel } from "./setting";

export default {
  JobModel,
  JobLogModel,
  ApiKeyModel,
  SettingModel
};

export { JobModel, JobLogModel, ApiKeyModel, SettingModel };

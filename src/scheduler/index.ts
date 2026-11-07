// src/scheduler/index.ts
// node-cron task-уудын цор ганц эзэн. Job бүр DB дээр үнэн эх сурвалжтай;
// task ажиллах бүрт DB-ээс шинэ config-оо уншина (update шууд үйлчилнэ).
import https from "https";

import axios, { AxiosRequestConfig } from "axios";
import cron, { ScheduledTask } from "node-cron";

import { CONFIG } from "../config/env";
import { JobLogModel, JobModel } from "../models";
import { JobDoc } from "../models/job-list";
import { getRetention } from "../services/settings";
import logger from "../util/logger";

const log = logger.child("scheduler");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// job id → ScheduledTask (node-cron-ийн дотоод түлхүүрт найдахгүй, өөрсдөө хөтөлнө)
const registry = new Map<string, ScheduledTask>();
let retentionTask: ScheduledTask | null = null;

/* ---------------------------------------
 * Нэг ажлыг гүйцэтгэх + (log_enabled бол) log бичих
 * ------------------------------------- */
export async function executeJob(
  job: Pick<JobDoc, "id" | "config" | "type_name" | "log_enabled">
) {
  const started = Date.now();

  let status: "success" | "error" = "success";
  let httpCode: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let responseBody: any = null;
  let errorMessage: string | null = null;

  try {
    const config: AxiosRequestConfig = {
      ...(job.config as AxiosRequestConfig),
      httpsAgent,
      validateStatus: () => true,
      timeout: (job.config as AxiosRequestConfig)?.timeout ?? 60_000
    };

    const res = await axios(config);
    httpCode = res.status;
    responseBody = res.data;
    if (res.status >= 400) {
      status = "error";
      errorMessage = `HTTP ${res.status}`;
    }
  } catch (err) {
    status = "error";
    if (axios.isAxiosError(err)) {
      httpCode = err.response?.status ?? null;
      responseBody = err.response?.data ?? null;
      errorMessage = err.message;
    } else {
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  const duration = Date.now() - started;

  if (status === "error") {
    log.warn("job executed with error", { job_id: job.id, httpCode, duration, errorMessage });
  } else {
    log.info("job executed", { job_id: job.id, httpCode, duration });
  }

  if (job.log_enabled) {
    try {
      await JobLogModel.create({
        job_id: job.id,
        type_name: job.type_name,
        status,
        http_code: httpCode,
        duration_ms: duration,
        request_config: job.config,
        response_body: responseBody,
        error_message: errorMessage
      });
    } catch (e) {
      log.error("failed to write job log", e, { job_id: job.id });
    }
  }
}

/** Task ажиллах бүрт DB-ээс шинэ job-оо уншина */
async function runJobById(id: string) {
  try {
    const job = await JobModel.findOne({ id }).lean();
    if (!job || !job.status) return;
    await executeJob(job);
  } catch (e) {
    log.error("runJobById failed", e, { job_id: id });
  }
}

/* ---------------------------------------
 * Хуваарь удирдлага
 * ------------------------------------- */
export function stopJob(id: string): void {
  const task = registry.get(id);
  if (task) {
    try {
      task.stop();
    } catch {
      /* ignore */
    }
    registry.delete(id);
    log.info("job stopped", { job_id: id });
  }
}

export function scheduleJob(id: string, jobTime: string): boolean {
  if (!cron.validate(jobTime)) {
    log.warn("invalid cron expression", { job_id: id, job_time: jobTime });
    return false;
  }
  // Байвал эхлээд устгаад дахин хуваарилна (job_time солигдсон байж болно)
  stopJob(id);
  const task = cron.schedule(jobTime, () => void runJobById(id), { name: id });
  registry.set(id, task);
  log.info("job scheduled", { job_id: id, job_time: jobTime });
  return true;
}

export function stopAllJobs(): number {
  let count = 0;
  for (const [id, task] of registry) {
    try {
      task.stop();
    } catch {
      /* ignore */
    }
    registry.delete(id);
    count++;
  }
  return count;
}

/* ---------------------------------------
 * DB ↔ санах ойн хуваарийг нийцүүлэх (restart-ийн дараа дуудагдана)
 * ------------------------------------- */
export async function syncJobs(): Promise<void> {
  try {
    const jobs = await JobModel.find({}).lean();
    for (const job of jobs) {
      try {
        if (job.status) scheduleJob(job.id, job.job_time);
        else stopJob(job.id);
      } catch (e) {
        log.error("sync job failed", e, { job_id: job.id });
      }
    }
    log.info("sync done", {
      active: jobs.filter((j) => j.status).length,
      total: jobs.length
    });
  } catch (e) {
    log.error("syncJobs failed", e);
  }
}

/* ---------------------------------------
 * Log retention цэвэрлэгээ
 * ------------------------------------- */
export async function cleanupLogs(): Promise<number> {
  try {
    const { enabled, days } = await getRetention();
    if (!enabled) return 0;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const res = await JobLogModel.deleteMany({ createdAt: { $lt: cutoff } });
    const deleted = res.deletedCount ?? 0;
    if (deleted > 0) log.info("logs cleaned up", { deleted, days });
    return deleted;
  } catch (e) {
    log.error("cleanupLogs failed", e);
    return 0;
  }
}

export function startRetentionCron(): void {
  const expr = CONFIG.LOG_RETENTION_CRON;
  if (!cron.validate(expr)) {
    log.warn("invalid retention cron — retention disabled", { expr });
    return;
  }
  if (retentionTask) return;
  retentionTask = cron.schedule(expr, () => void cleanupLogs(), { name: "__log_retention__" });
  log.info("retention cron started", { expr });
}

// src/auth/index.ts
// Boot — app эхлэхэд нэг удаа ажиллана: DB холбох → хуваарь сэргээх → retention cron.
import { CONFIG } from "../config/env";
import connectDB from "../config/nosql";
import { startRetentionCron, syncJobs } from "../scheduler";
import logger from "../util/logger";

void (async () => {
  await connectDB({
    mongoUrl: CONFIG.MONGODB_URI,
    mongoDB: CONFIG.MONGODB_dbName
  });

  try {
    // Restart-ийн дараа идэвхтэй ажлуудыг дахин хуваарьт оруулна
    await syncJobs();
  } catch (error) {
    logger.error("job sync failed", error);
  }

  try {
    startRetentionCron();
  } catch (error) {
    logger.error("retention cron failed", error);
  }
})();

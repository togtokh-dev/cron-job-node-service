// src/config/nosql.ts
import mongoose from "mongoose";

import logger from "../util/logger";

const log = logger.child("mongo");

export type connectType = {
  mongoUrl: string;
  mongoDB: string;
};

const connectDB = async ({ mongoUrl, mongoDB }: connectType) => {
  mongoose.set("strictQuery", true);
  try {
    const conn = await mongoose.connect(mongoUrl, { dbName: mongoDB });
    log.info("connected", { host: conn.connection.host, db: conn.connection.name });
  } catch (error) {
    log.fatal("connection failed — is MongoDB running?", error);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    log.warn("disconnected — reconnecting");
    void connectReload({ mongoUrl, mongoDB });
  });
};

export const connectReload = async ({ mongoUrl, mongoDB }: connectType) => {
  mongoose.set("strictQuery", true);
  try {
    const conn = await mongoose.connect(mongoUrl, { dbName: mongoDB });
    log.info("reconnected", { host: conn.connection.host, db: conn.connection.name });
  } catch (error) {
    log.error("reconnect failed", error);
  }
};

export default connectDB;

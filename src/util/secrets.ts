import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

export const ENV_TYPE = process.env.NODE_ENV || process.env.npm_lifecycle_event;
if (ENV_TYPE == "production") {
  if (fs.existsSync(path.resolve(__dirname, "../../.env"))) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  } else if (fs.existsSync(path.resolve(__dirname, "../../.env.production"))) {
    logger.debug(
      "Using .env.production file to supply config environment variables"
    );
    dotenv.config({ path: path.resolve(__dirname, "../../.env.production") });
  } else {
    logger.error("No environment variable.");
    process.exit(1);
  }
} else if (ENV_TYPE == "development") {
  if (fs.existsSync(path.resolve(__dirname, "../../.env.development"))) {
    logger.debug(
      "Using .env.development file to supply config environment variables"
    );
    dotenv.config({ path: path.resolve(__dirname, "../../.env.development") });
  } else {
    logger.error("No environment variable.");
    process.exit(1);
  }
} else if (ENV_TYPE == "staging") {
  if (fs.existsSync(path.resolve(__dirname, "../../.env.staging"))) {
    logger.debug(
      "Using .env.staging file to supply config environment variables"
    );
    dotenv.config({ path: path.resolve(__dirname, "../../.env.staging") });
  } else {
    logger.error("No environment variable.");
    process.exit(1);
  }
} else {
  console.log(ENV_TYPE);
  console.log(process.env);
  logger.error("No environment variable.");
  process.exit(1);
}

export const ENVIRONMENT =
  process.env.NODE_ENV || process.env.npm_lifecycle_event;

export const MONGODB_URI = process.env["MONGODB_URI"];

if (!MONGODB_URI) {
  logger.error(
    "No mongo connection string. Set MONGODB_URI environment variable."
  );
  process.exit(1);
}

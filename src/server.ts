import errorHandler from "errorhandler";
import app from "./app";
import https from "https";
import fs from "fs";
import http from "http";
import IP from "ip";
import path from "path";
import { ENV_TYPE } from "./util/secrets";
// import pool from "./config/sql";
/**
 * Error Handler. Provides full stack
 */

if (ENV_TYPE === "development") {
  app.use(errorHandler());
}

let server;
if (process.env.SSL === "true") {
  server = https.createServer(
    {
      key: fs.readFileSync(path.resolve(__dirname, "../ssl/ssl.key")),
      cert: fs.readFileSync(path.resolve(__dirname, "../ssl/ssl.pem")),
    },
    app
  );
} else {
  server = http.createServer(app);
}

/**
 * Start Express server
 */
server.listen(app.get("port"), async () => {
  const ipAddress = IP.address();
  if (process.env.SSL === "true") {
    console.log(
      "App id running at https://%s:%d in %s mode",
      ipAddress,
      app.get("port"),
      ENV_TYPE
    );
  } else {
    console.log(
      "App id running at http://%s:%d in %s mode",
      ipAddress,
      app.get("port"),
      ENV_TYPE
    );
  }

  console.log("Press CTRL-C to stop\n");
});
export default server;

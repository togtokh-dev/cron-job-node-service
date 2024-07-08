import express, { Express, Request, Response } from "express";
import connectMongoDB from "./config/nosql";
import { MONGODB_URI } from "./util/secrets";
import auth from "./auth";
import routers from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileupload from "express-fileupload";
import bodyParser from "body-parser";
import lusca from "lusca";
import compression from "compression";
import date from "date-and-time";
import morgan from "morgan";
import path from "path";
import { sync } from "./api/controller";
auth.authMaster();
connectMongoDB({
  mongoUrl: MONGODB_URI,
  mongoDB: process.env.MONGODB_dbName,
});
if (process.env.SERVER == "prod") {
  console.log("NewRelic ON ");
  import("newrelic");
}
sync();
const jsonParser = bodyParser.json();
const app: Express = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

app.use(
  morgan(function (tokens: any, req: any, res: any) {
    return [
      date.format(new Date(), "YYYY/MM/DD HH:mm:ss"),
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);
app.use(
  cookieParser(),
  fileupload(),
  jsonParser,
  compression(),
  lusca.xframe("SAMEORIGIN"),
  lusca.xssProtection(true),
  cors({
    origin: process.env.APP_URL || "*",
    allowedHeaders: "Set-Cookie, Content-Type, Authorization",
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
  }),
  function (req, res, next) {
    next();
    express.json();
  }
);
app.use("/", express.static(path.join(__dirname, "../public")));
app.use(routers);
app.set("port", process.env.PORT || 3000);
export default app;

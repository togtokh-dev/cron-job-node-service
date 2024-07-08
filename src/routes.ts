import { Request, Response, Router } from "express";
import mainRouter from "./api/router";
// Routes
const router = Router();
const routers = Router();
//
router.use("/v1", mainRouter);
//
routers.use("/cron-job", router);
// Router not found
routers.all("*", (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: "404",
  });
});

export default routers;

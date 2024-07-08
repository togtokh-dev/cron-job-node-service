import { Router } from "express";
const router = Router();
import authMaster from "auth-master";
import {
  create,
  update,
  remove,
  getall,
  getone,
  list_create,
} from "./controller";
router.post(
  "/list",
  authMaster.checkTokenBearer(["reportToken"], { required: true }),
  list_create
);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.get("/", getall);
router.get("/:id", getone);

export default router;

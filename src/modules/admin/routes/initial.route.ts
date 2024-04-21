import express from "express";
import { Log, LogEverything } from "../../../middlewares";
import * as initialController from "../controllers/initial.controller";

const router = express.Router();

router.get("/", initialController.List);
router.get("/:id", initialController.One);
router.put("/:id", LogEverything, initialController.Update);
router.delete("/refuse/:id", Log, initialController.refuse);
export default router;

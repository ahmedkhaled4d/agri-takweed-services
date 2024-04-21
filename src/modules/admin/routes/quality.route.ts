import express from "express";
import * as qualityController from "../controllers/quality.controller";

const router = express.Router();

router.get("/", qualityController.List);
router.post("/", qualityController.Create);
router.get("/:id", qualityController.One);
router.put("/:id", qualityController.Update);
router.delete("/:id", qualityController.Delete);

export default router;

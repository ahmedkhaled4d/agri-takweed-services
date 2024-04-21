import express from "express";
import * as farmController from "../controllers/farm.controller";

const router = express.Router();
router.get("/", farmController.List);
router.get("/:farmId", farmController.One);
router.post("/", farmController.create);
router.delete("/:farmId", farmController.Delete);

export default router;

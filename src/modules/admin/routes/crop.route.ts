import express from "express";
const router = express.Router();
import * as cropController from "../controllers/crop.controller";

router.get("/", cropController.List);
router.post("/", cropController.Create);
router.get("/:id", cropController.One);
router.put("/:id", cropController.Update);
router.delete("/:id", cropController.Delete);

export default router;

import express from "express";
import * as committeeController from "../controllers/committee.controller";

const router = express.Router();
router.get("/", committeeController.List);
router.get("/:_id", committeeController.One);
router.put("/:_id", committeeController.Update);

router.get("/:_id/sort", committeeController.sortComitteeFarms);

export default router;

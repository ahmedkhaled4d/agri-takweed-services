import express from "express";
import * as topicsController from "../controllers/topics.controller";

const router = express.Router();
router.get("/", topicsController.topicsList);
router.post("/", topicsController.createTopic);

export default router;

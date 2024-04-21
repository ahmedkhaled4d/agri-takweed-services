import express from "express";
import { Log } from "../../../middlewares";
import * as topicsController from "../controllers/topics.controller";

const router = express.Router();

router.get("/", topicsController.topicsList);
router.put("/:id", topicsController.updateTopic);
router.put("/active/:id", topicsController.activeTopic);
router.put("/deactive/:id", topicsController.deactiveTopic);
router.post("/", topicsController.createTopic);
router.delete("/:id", Log, topicsController.deleteTopic);

export default router;

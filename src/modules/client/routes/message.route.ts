import express from "express";
import * as messageController from "../controllers/message.controller";

const router = express.Router();
router.get("/", messageController.List);
router.post("/one", messageController.List);

export default router;

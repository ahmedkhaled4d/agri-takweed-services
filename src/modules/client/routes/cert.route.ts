import express from "express";
import * as certController from "../controllers/cert.controller";

const router = express.Router();
router.get("/:code", certController.verifyApp);

export default router;

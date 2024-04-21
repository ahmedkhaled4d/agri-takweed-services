import express from "express";
import * as initialController from "../controllers/initial.controller";

const router = express.Router();

router.post("/initialrequest", initialController.handleIntitialRequest);
router.get("/", initialController.List);
router.get("/doc/:code", initialController.getUrl);

export default router;

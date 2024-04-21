import express from "express";
import { Log } from "../../../middlewares";
import * as docController from "../controllers/document.controller";
const router = express.Router();

router.get("/", docController.List);
router.get("/generatepdf/:code", Log, docController.genrateDocPdfController);
router.get("/sign/:code", docController.getUrl);
export default router;

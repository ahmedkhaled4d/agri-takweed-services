import express from "express";
const router = express.Router();
import * as certController from "../controllers/cert.controller";

// close uploading PDF file temporary
// router.post('/upload/:code',certController.uploadFile);
router.get("/generatepdf/:id", certController.genrateCertPdfController);
router.post("/reject/:code", certController.reject);
router.get("/download/:name", certController.download);

export default router;

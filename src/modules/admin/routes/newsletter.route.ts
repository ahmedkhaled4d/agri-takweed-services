import express from "express";
import * as newsletterController from "../controllers/newsletter.controller";

const router = express.Router();

router.get("/", newsletterController.subscribersList);
router.put("/active/:id", newsletterController.Active);
router.put("/deactive/:id", newsletterController.Deactive);
router.post("/", newsletterController.createSubscriber);

export default router;

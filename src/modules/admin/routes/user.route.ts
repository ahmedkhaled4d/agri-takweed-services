import express from "express";
import { Log, LogEverything } from "../../../middlewares";
import * as userController from "../controllers/user.controller";

const router = express.Router();

router.get("/", userController.List);
router.get("/engineers", userController.getEngineers);
router.get("/:userId/permission", userController.getPermissions);
router.get("/:id", userController.One);

router.put("/:id", LogEverything, userController.Update);
router.put("/:id/active", Log, userController.activeOTP);
router.put("/:id/deactive", Log, userController.DeactiveOTP);
router.put("/:id/activecert", Log, userController.activeReviewer);
router.put("/:id/deactivecert", Log, userController.DeactiveReviwer);

router.delete("/:id", Log, userController.Delete);

router.post("/notify/group", Log, userController.NotifyGroup);
router.post("/:id/message", userController.SendMessage);
router.post("/:userId/permission", Log, userController.ModifyPermissions);

export default router;

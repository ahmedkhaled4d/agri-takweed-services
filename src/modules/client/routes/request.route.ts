import express from "express";
import { verifyRoles } from "../../../middlewares";
import * as requestController from "../controllers/request.controller";
import * as searchController from "../controllers/search.controller";
// WARN: Not Used!
// import loanController from "../controllers/loan.controller";

const router = express.Router();

router.get(
  "/",
  verifyRoles(["client", "engineer", "admin"]),
  requestController.List
);
router.post(
  "/",
  verifyRoles(["client", "engineer", "admin"]),
  requestController.Create
);
router.post(
  "/verifyCert",
  verifyRoles(["client", "engineer", "admin"]),
  requestController.verifyCertificate
);
router.get(
  "/:code",
  verifyRoles(["client", "engineer", "admin"]),
  requestController.download
);
router.get(
  "/sign/:code",
  verifyRoles(["client", "engineer", "admin"]),
  requestController.getUrl
);
router.delete(
  "/:reqId",
  verifyRoles(["client", "engineer", "admin"]),
  requestController.cancelled
);

// search
router.get("/search/:code", searchController.One);

export default router;

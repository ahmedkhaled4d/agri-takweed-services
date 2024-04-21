import {
  createExpressServer,
  handleExpressError
} from "../../../helpers/express";
import { extractToken } from "../../../middlewares";
import { verifyRoles } from "../../../middlewares/auth.middleware";
import cert from "./cert.route";
import combinedMap from "./combinedMap.route";
import committee from "./committee.route";
import crop from "./crop.route";
import dashboard from "./dashboard.route";
import userDoc from "./document.route";
import hubRouter from "./hub.router";
import initial from "./initial.route";
import loan from "./loan.route";
import location from "./location.route";
import logger from "./logger.router";
import media from "./media.route";
import newsletter from "./newsletter.route";
import pointsMap from "./pointsMap.route";
import posts from "./posts.route";
import quality from "./quality.route";
import report from "./report.route";
import request from "./request.route";
import reqExcelDataRouter from "./requestExcelData.router";
import traceabilityRouter from "./requestTraceability.router";
import store from "./store.route";
import storeCert from "./storeCert.route";
import topics from "./topics.route";
import user from "./user.route";
import weatherRouter from "./weather.router";

const ADMIN_APP = createExpressServer();
ADMIN_APP.use(extractToken);
ADMIN_APP.use(verifyRoles(["admin", "hagr"]));

ADMIN_APP.use("/user", user);
ADMIN_APP.use("/quality", quality);
ADMIN_APP.use("/crop", crop);
ADMIN_APP.use("/location", location);
// Named excel-data to avoid conflict with request.route.ts
ADMIN_APP.use("/request/excel-data", reqExcelDataRouter);
ADMIN_APP.use("/request", request);
ADMIN_APP.use("/initial", initial);
ADMIN_APP.use("/cert", cert);
ADMIN_APP.use("/storecert", storeCert);
ADMIN_APP.use("/dashboard", dashboard);
ADMIN_APP.use("/map", combinedMap);
ADMIN_APP.use("/newsletter", newsletter);
ADMIN_APP.use("/topics", topics);
ADMIN_APP.use("/posts", posts);
ADMIN_APP.use("/media", media);
ADMIN_APP.use("/report", report);
ADMIN_APP.use("/store", store);
ADMIN_APP.use("/pointsmap", pointsMap);
ADMIN_APP.use("/documents", userDoc);
ADMIN_APP.use("/loan", loan);
ADMIN_APP.use("/committee", committee);
ADMIN_APP.use("/logs", logger);
ADMIN_APP.use("/hub", hubRouter);
ADMIN_APP.use("/traceability", traceabilityRouter);
ADMIN_APP.use("/weather", weatherRouter);

handleExpressError(ADMIN_APP);

export default ADMIN_APP;

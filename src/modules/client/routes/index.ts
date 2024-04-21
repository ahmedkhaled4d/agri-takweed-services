import {
  createExpressServer,
  handleExpressError
} from "../../../helpers/express";
import { extractToken } from "../../../middlewares";
import { verifyRoles } from "../../../middlewares/auth.middleware";
import cert from "./cert.route";
import committee from "./committee.route";
import farm from "./farm.route";
import initial from "./initial.route";
import loan from "./loan.route";
import master from "./master.route";
import message from "./message.route";
import posts from "./posts.route";
import reqTraceRouter from "./reqtrace.route";
import request from "./request.route";
import topics from "./topics.route";

const CLIENT_APP = createExpressServer();
CLIENT_APP.use(extractToken);

/**
 * define Auth routes for our app
 */
CLIENT_APP.use(
  "/messages",
  verifyRoles(["client", "engineer", "admin", "hagr"]),
  message
);

CLIENT_APP.use("/farm", verifyRoles(["client", "engineer"]), farm);

CLIENT_APP.use("/request", request);

CLIENT_APP.use(
  "/initial",
  verifyRoles(["client", "engineer", "admin"]),
  initial
);

CLIENT_APP.use("/loan", verifyRoles(["client", "engineer"]), loan);

CLIENT_APP.use(
  "/committee",
  verifyRoles(["engineer", "hagr", "admin"]),
  committee
);

// global routes
CLIENT_APP.use("/certificate", cert);
CLIENT_APP.use("/traceability", reqTraceRouter);
CLIENT_APP.use("/master", master);
CLIENT_APP.use("/topics", topics);
CLIENT_APP.use("/posts", posts);

handleExpressError(CLIENT_APP);

export default CLIENT_APP;

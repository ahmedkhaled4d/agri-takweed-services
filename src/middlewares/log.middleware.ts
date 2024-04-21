import { error } from "firebase-functions/logger";
import * as LoggerRepo from "../repositories/logger.repository";
import { ExpressFunc } from "../types";

// Used to log actions by user and request info.
// does not block event loop.
export const Log: ExpressFunc = (req, res, next) => {
  try {
    const ip =
      req.headers["fastly-client-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip;
    res.on("finish", () => {
      // Don't block
      LoggerRepo.Create({
        userId: res.locals.user?.userId,
        action: req.method as string,
        resource: req.originalUrl,
        type: res.statusCode < 210 ? "info" : "bad_request",
        payload: {
          status: res.statusCode
        },
        ip: ip as string,
        userAgent: req.get("user-agent") ?? "unknown",
        contentLength: Number(res.get("content-length") ?? 0)
      });
    });
    next();
  } catch (err) {
    error("Error in logging middleware: ", err);
    // Ignore all errors here and continue normally.
    next();
  }
};

export const LogEverything: ExpressFunc = (req, res, next) => {
  try {
    const ip =
      req.headers["fastly-client-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip;
    res.on("finish", () => {
      // Don't block
      LoggerRepo.Create({
        userId: res.locals.user.userId,
        action: req.method as string,
        resource: req.originalUrl,
        type: res.statusCode < 210 ? "info" : "bad_request",
        payload: {
          status: res.statusCode,
          body: req.body,
          params: req.params,
          query: req.query
        },
        ip: ip as string,
        userAgent: req.get("user-agent") ?? "unknown",
        contentLength: Number(res.get("content-length") ?? 0)
      });
    });
    next();
  } catch (err) {
    error("Error in logging middleware: ", err);
    // Ignore all errors here and continue normally.
    next();
  }
};

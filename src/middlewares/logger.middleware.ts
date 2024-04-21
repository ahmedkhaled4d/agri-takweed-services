import { Request, Response, NextFunction } from "express";
import { info } from "firebase-functions/logger";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // firebase uses fastly-client-ip,
  // dev uses x-forwarded-for and local uses normal ip...
  const ip =
    req.headers["fastly-client-ip"] || req.headers["x-forwarded-for"] || req.ip;
  res.on("finish", () => {
    info(
      `${new Date().toISOString()} Finished ${req.method}:${
        req.originalUrl
      } status ${res.statusCode} ${res.get("content-length")} - ${req.get(
        "user-agent"
      )} ${ip}`
    );
  });
  next();
};

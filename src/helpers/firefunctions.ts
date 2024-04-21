import type { Request } from "express";
import type { https } from "firebase-functions/v1";

export const checkHasRawBody = (req: Request): req is https.Request => {
  if (Object.prototype.hasOwnProperty.call(req, "rawBody")) {
    return true;
  }
  return false;
};

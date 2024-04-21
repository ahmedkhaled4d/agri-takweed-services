import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils";
import { verifyJwt } from "../modules/auth/services/jwt.service";

export function handleCookieMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Only handle extraction, leave verification to the next middleware
    const token =
      req.signedCookies["access_token"] || req.cookies["access_token"];
    if (!token) return next();

    const { err, value } = verifyJwt(token);
    if (value) {
      res.locals.user = value;
      return next();
    }

    if (err) {
      throw new UnauthorizedError("Expired Jwt Token", res);
    }

    return next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return;
    return next(err);
  }
}

import { verifyJwt } from "../modules/auth/services/jwt.service";
import { UnauthorizedError } from "../utils";
import { handleCookieMiddleware } from "./extractCookie.middleware";
import type { NextFunction, Request, Response } from "express";

export const extractToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization)
      // attempt to extract token from cookie
      return handleCookieMiddleware(req, res, next);

    const accessToken: string = req.headers.authorization.replace(
      /^Bearer\s/, // Removes Bearer from token
      ""
    );

    const { err, value } = verifyJwt(accessToken);

    if (value) {
      res.locals.user = value;
      return next();
    }

    if (err) {
      throw new UnauthorizedError("Expired Jwt Token", res);
    }

    return next();
  } catch (e) {
    if (e instanceof UnauthorizedError) return;
    next(e);
  }
};

export default extractToken;

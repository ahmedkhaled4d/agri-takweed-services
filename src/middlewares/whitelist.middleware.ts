import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../assets/httpCodes";
import { HttpError } from "../utils/error";

export const whitelistIds =
  (ids: Array<string>) => (_: Request, res: Response, next: NextFunction) => {
    try {
      if (!res.locals.user.userId)
        throw new HttpError("User not allowed to delete", HttpStatus.FORBIDDEN);
      if (ids.includes(res.locals.user.userId)) {
        return next();
      }
      throw new HttpError("User not allowed to delete", HttpStatus.FORBIDDEN);
    } catch (e) {
      next(e);
    }
  };

import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils";

export const verifyRoles =
  (roles: Array<string>) => (_: Request, res: Response, next: NextFunction) => {
    try {
      if (!res.locals.user?.role)
        throw new UnauthorizedError("Roles not included?", res);
      if (roles.includes(res.locals.user.role)) {
        return next();
      }
      throw new UnauthorizedError("Role not authorized", res);
    } catch (e) {
      if (e instanceof UnauthorizedError) return;
      return next(e);
    }
  };

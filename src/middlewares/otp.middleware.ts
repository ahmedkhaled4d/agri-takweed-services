import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/error";

export const protectedAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.otptoken;
    if (!authorization || authorization !== (process.env.OTP_TOKEN as string)) {
      throw new UnauthorizedError("ProtectedAuth", res);
    }
    next();
  } catch (e) {
    if (e instanceof UnauthorizedError) return;
    next(e);
  }
};

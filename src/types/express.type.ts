import { Request, Response, NextFunction } from "express";
import { jwtTokenPayload } from ".";

export interface CustomRequest extends Request {
  limit: number;
  skip: number;
}

export interface ResponseLocals {
  user: jwtTokenPayload;
}

export type ExpressFunc = (
  // eslint-disable-next-line no-unused-vars
  req: Request,
  // eslint-disable-next-line no-unused-vars
  res: Response<Record<string, unknown>, ResponseLocals>,
  // eslint-disable-next-line no-unused-vars
  next: NextFunction
) => unknown;

export type ExpressCustomFunc = (
  // eslint-disable-next-line no-unused-vars
  req: CustomRequest,
  // eslint-disable-next-line no-unused-vars
  res: Response<Record<string, unknown>, ResponseLocals>,
  // eslint-disable-next-line no-unused-vars
  next: NextFunction
) => unknown;

interface file {
  file: Buffer;
  info: {
    encoding: string;
    mimeType: string;
    filename: string;
  };
}

declare module "express-serve-static-core" {
  interface Request {
    limit: number;
    skip: number;
    files: Record<string, file>;
  }
}

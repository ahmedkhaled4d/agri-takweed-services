import { Response } from "express";
import { HttpStatus } from "../assets/httpCodes";

export class HttpError extends Error {
  status: number;
  payload?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    payload?: Record<string, unknown>
  ) {
    super(message);
    this.status = statusCode;
    this.payload = payload;
  }
}

export class UnauthorizedError extends HttpError {
  status = HttpStatus.UNAUTHORIZED;

  constructor(message: string, res: Response) {
    super(message);
    res.setHeader("www-authenticate", "Bearer");
    res.sendStatus(this.status);
  }
}

/**
 * @description used in the case of failing to transform a value
 */
export class BodyError extends HttpError {
  status = HttpStatus.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}

export class UserError extends HttpError {
  status = HttpStatus.BAD_REQUEST;

  constructor(
    public message: string,
    public cause: string,
    public location: string
  ) {
    super(message);
    this.message = message;
    this.cause = cause;
    this.location = location;
  }
}

export function mapErrorToResponse(err: unknown): {
  status: number;
  message: string;
  error?: unknown;
} {
  let error;
  if (err instanceof HttpError) {
    error = err;
  } else if (err instanceof Error) {
    error = new HttpError(err.message, 500, { error: err });
  } else {
    error = new HttpError("Unknown error!", 500, { error: err });
  }

  return {
    status: error.status,
    message: error.message,
    error: error.payload?.error
  };
}

import * as cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { error } from "firebase-functions/logger";
import { ErrorMessage } from "../assets/errors";
import { HttpStatus } from "../assets/httpCodes";
import { JWT_SECRET_TAKWEED } from "../config";
import { extractToken, loggerMiddleware, paginate } from "../middlewares";
import * as LoggerRepo from "../repositories/logger.repository";
import { ExpressFunc } from "../types";
import { HttpError } from "../utils";

/**
 * @description Creates an express app with the following middlewares
 * - cors with:
 *   * origin: true
 *   * credentials: true
 * - express.json
 * - express.urlencoded: { extended: true }
 * - cookieParser
 * - loggerMiddleware (Optional)
 * - paginate
 * @param {object} options - options for the express app
 * @param {object} options.jsonOptions - options for the json middleware
 * @param {boolean} options.jsonOptions.strict - if true, only objects and arrays will be allowed (default: false)
 * @see https://expressjs.com/en/api.html#express.json
 * @param {object} options.loggerOptions - options for the logger middleware
 * @returns {express.Application} express app
 *
 * @example
 *  const app = createExpressServer({
 *  jsonOptions: { strict: false ,
 *  loggerOptions: { disable: false }
 *  });
 */
export function createExpressServer(options?: {
  jsonOptions?: Record<string, string>;
  loggerOptions?: {
    disable?: boolean;
  };
}): express.Application {
  const app = express();
  app.use(
    cors({
      origin: true,
      maxAge: 60 * 10, // 10 mins
      /* preflightContinue: true, */
      credentials: true,
      exposedHeaders: [
        "content-disposition",
        "content-length",
        "content-type",
        "date",
        "etag"
      ]
    })
  );
  app.use(express.json(options?.jsonOptions ?? {}));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser.default(JWT_SECRET_TAKWEED));
  if (!options?.loggerOptions?.disable) app.use(loggerMiddleware);
  app.use(paginate as ExpressFunc);
  return app;
}

/**
 * @description Handles express errors
 * - If the error is an instance of HttpError, it will return the error message and status code (default: 500). If the error has a payload, it will be returned as well
 * - Any other error will be logged in db and running logs and a generic error message will be returned
 * - If the error is a mongoose error, it will attempt to Normalize the error and return the appropriate status code and message. Ex: 110000 Conflict
 * - else it will return a 500 status code and a generic message
 * @param {express.Application} app - express app
 * @returns {express.Application} express app with error handler (To be chained with createExpressServer)
 */
export function handleExpressError(
  app: express.Application
): express.Application {
  app.use(
    async (
      err: {
        code: number;
        errors: Record<string, unknown>;
      } & Error,
      req: express.Request,
      res: express.Response<Record<string, unknown>>,
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      if (err instanceof HttpError)
        return res
          .status(err.status)
          .json({ message: err.message, error: true, ...err.payload });
      extractToken(req, res, () => {});
      const ip =
        req.headers["fastly-client-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip;
      error({
        errorName: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack || "no stack defined"
      });
      // Create a log for the error, attempt to log the user id if possible
      LoggerRepo.Create({
        userId: res.locals.user?.userId,
        action: req.method as string,
        resource: req.originalUrl,
        type: "error",
        payload: {
          status: 500,
          errorName: err.name,
          message: err.message,
          code: err.code,
          stack: err.stack || "no stack defined",
          body: req.body,
          params: req.params,
          query: req.query
        },
        ip: ip as string,
        userAgent: req.get("user-agent") ?? "unknown",
        contentLength: Number(res.get("content-length") ?? 0)
      });
      // Inspired by https://github.com/kasongoyo/mongoose-errors/blob/master/index.js
      switch (err.name) {
        // Normalize mongoose errors
        case "MongoServerError":
        case "MongoError":
          if (err.code === 11000)
            return res.status(HttpStatus.CONFLICT).json({
              message: err.message.match(/dup key.*/)
              /* info: err.keyValue */
            });
          break;
        // Occurs due to invalid data (such as not having a required feild) return 400.
        case "ValidationError":
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: ErrorMessage.INVALID_PARAMS,
            info: Object.keys(err.errors).reduce(
              (acc, key) => {
                acc[key] = (err.errors[key] as Error).message;
                return acc;
              },
              {} as Record<string, string>
            )
          });
        // castError occur with mongoose find operations fails;
        // it make sense to associate it with 404 http code
        case "CastError":
          return res
            .status(HttpStatus.NOT_FOUND)
            .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server Error" });
    }
  );
  return app;
}

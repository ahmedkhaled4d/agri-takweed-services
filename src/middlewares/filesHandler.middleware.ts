import Busboy from "busboy";
import type { Request, Response, NextFunction } from "express";
import * as LoggerRepo from "../repositories/logger.repository";
import type { https } from "firebase-functions";
import { ErrorMessage } from "../assets/errors";
import { HttpStatus } from "../assets/httpCodes";

// Ref
// https://github.com/mscdex/busboy/issues/296
// https://github.com/stripe/stripe-node/issues/341#issuecomment-617193575
// https://github.com/firebase/firebase-functions/issues/417#issuecomment-760762364
// https://cloud.google.com/functions/docs/writing/write-http-functions#multipart_data

export const filesHandler =
  (fileLimit: number, reqFormFilesNames: Array<string> = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    // First check  the request type
    if (!req.headers["content-type"])
      return res.status(HttpStatus.BAD_REQUEST).send({
        error: "Invalid file",
        code: "invalid_upload_file"
      });

    // Init the files obj
    if (!req.files) req.files = {};

    const errors: Array<unknown> = [];

    // Prepare busboy
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 0.5 * 1024 * 1024, // max image size to 2 MB
        files: fileLimit
      }
    });

    // Recieved File stream
    busboy.on("file", (key, file, info) => {
      if (!reqFormFilesNames.includes(key))
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: ErrorMessage.INVALID_PARAMS });

      // wait till file upload is finished
      const chuncks: Array<Uint8Array> = [];

      // Every chunck is pure bytes
      file.on("data", chunck => chuncks.push(chunck));

      // In case of multiple files, attempt to parse them all and then
      // return the error of file with its name.
      file.on("error", err => errors.push({ error: err, key, info }));

      // Concat it in a single Buffer
      file.on("end", () => {
        // Add it to the shape of request (Type extended from folder types)
        req.files[key] = {
          file: Buffer.concat(chuncks),
          info: info
        };
      });
    });

    // On Error Stop
    busboy.on("error", err => next(err));

    // For the body
    busboy.on("field", (key, value) => {
      // You could do additional deserialization logic here, values will just be
      // strings, incase of obj call Json.parse!
      req.body[key] = value;
    });

    const handleErrors = (errors: Array<unknown>) => {
      if (errors.length < 1) return false;
      const ip =
        req.headers["fastly-client-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip;
      LoggerRepo.Create({
        userId: res.locals.user.userId,
        action: req.method as string,
        resource: req.originalUrl,
        type: "error",
        payload: {
          status: 500,
          params: req.params,
          query: req.query,
          errors: errors
        },
        ip: ip as string,
        userAgent: req.get("user-agent") ?? "unknown",
        contentLength: Number(res.get("content-length") ?? 0)
      });
      // Stop Execution
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ message: ErrorMessage.SOMETHING_WRONG_FILE, errors });
      return true;
    };

    const handleFirebaseFireFunction = () => {
      return new Promise((resolve, reject) => {
        busboy.end((req as https.Request).rawBody, () => {
          if (handleErrors(errors)) return reject(errors);
          return resolve(next());
        });
      });
    };

    // TODO: Look into replacing ts-ignore, not very friendly
    // This is done as firebase functions Request shape differs from
    // express shape.

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (req.rawBody) {
      return handleFirebaseFireFunction();
    } else {
      // On stream close finish
      // The issue with normally not using this event to finish the request
      // and instead using the busboy.end for firebase is that firebase
      // won't wait for the event to finish, it needs a promise to wait.
      busboy.on("close", () => {
        if (handleErrors(errors)) return;
        return next();
      });
      req.pipe(busboy);
    }
  };

import { Storage } from "@google-cloud/storage";
import Busboy from "busboy";
import Excel from "exceljs";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import os from "os";
import path from "path";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { RequestDocument, RequestModel, UserModel } from "../../../models";
import * as LoggerService from "../../../repositories/logger.repository";
import { ExpressFunc, GoogleFileInfo } from "../../../types";
import { hashPassword } from "../../auth/services/hashing.service";

const workbook = new Excel.Workbook();

// Imports the Google Cloud client library

const storage = new Storage({
  keyFilename: path.join(__dirname, "../../../config/serviceAccount.json"),
  projectId: "takweed-eg"
});
const BUSCKET_NAME = "gs://takweed-certificates/";
const bucket = storage.bucket(BUSCKET_NAME);

// Handlers
export const uploadFile = async (req: Request, res: Response) => {
  // const folder = req.params.folder; // Why?

  if (!req.headers["content-type"]) {
    res.status(500).send({
      error: "Invalid file",
      code: "invalid_upload_file"
    });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 0.5 * 1024 * 1024, // max image size to 2 MB
      files: 1 // Limit to one file upload
    }
  });

  const tmpdir = os.tmpdir();
  let filepath = "";
  const newfile = String(Date.now());
  // This code will process each file uploaded.
  busboy.on("file", (_, file, info) => {
    const { encoding, mimeType: mimetype } = info;
    let filename = info.filename;
    console.log(
      `Process File: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
    );
    filename = newfile.concat(filename);
    filepath = path.join(tmpdir, filename);
    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    // chnage Certificates URL

    // Triggered once all uploaded files are processed by Busboy.
    // We still need to wait for the disk writes (saves) to complete.
    busboy.on("finish", async () => {
      const options = {
        gzip: true,
        metadata: {
          // (If the contents will change, use cacheControl: 'no-cache')
          cacheControl: "public, max-age=31536000"
        }
      };
      const data = await storage.bucket(BUSCKET_NAME).upload(filepath, options);

      res.json({
        status: "Upload successful",
        link: `https://storage.googleapis.com/takweed-eg.appspot.com/${data[0].metadata.name}`,
        data: data[0].metadata
      });
      fs.unlinkSync(filepath);
    });
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (req.rawBody) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
};

export const getListFiles = async (_: Request, res: Response) => {
  try {
    const [files] = await bucket.getFiles();
    const fileInfos: Array<GoogleFileInfo> = [];
    files.forEach(file => {
      fileInfos.push({
        name: file.name,
        url: file.metadata.mediaLink,
        file
      });
    });
    res.status(200).send(fileInfos);
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Unable to read list of files!"
    });
  }
};

export const removeFile = async (req: Request, res: Response) => {
  const fileName = req.params.file;
  console.log("req.params.file", req.params.file);

  try {
    await bucket.file(fileName).delete();
    res.status(200).send({
      message: `${fileName} has been deleted`
    });
  } catch (err) {
    // console.log('err',err);
    res.status(500).send({
      message: err
    });
  }
};

export const xlsxFileHandeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // WARN: This wasn't used.
  // const folder = req.params.folder;
  const session = await mongoose.startSession();

  if (!req.headers["content-type"]) {
    res.status(HttpStatus.BAD_REQUEST).send({
      error: "Invalid file",
      code: "invalid_upload_file"
    });
  }
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 0.5 * 1024 * 1024, // max image size to 2 MB
      files: 1 // Limit to one file upload
    }
  });

  busboy.on("file", async (name, file, info) => {
    try {
      // Don't block
      LoggerService.Create({
        userId: res.locals.user.userId,
        action: req.method as string,
        resource: req.originalUrl,
        type: "info",
        payload: {
          message: `Processing file ${info.filename}`,
          name,
          info
        },
        userAgent: req.get("user-agent") ?? "unknown"
      });

      // read excel file from buffer
      const workbook = new Excel.Workbook();
      await workbook.xlsx.read(file);
      // get first workbook
      const sheet = workbook.getWorksheet(1);
      if (!sheet) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: "Empty excel sheet! Couldn't get worksheet",
          error: "excel.empty"
        });
      }
      // loop over rows
      // WARN: LEAN DOCUMENT TYPEEEE
      const reqs: Array<Promise<RequestDocument | null>> = [];
      const codes: Array<string> = [];
      session
        .withTransaction(async () => {
          sheet.eachRow((row, rowNumber) => {
            // skip first row
            if (rowNumber === 1) return;
            // get row values
            const values = row.values as Array<string>;
            console.log("values", values);
            // skip empty rows
            if (!values[1]) return;
            // push row values to requests array
            if (values[2] && values[1]) {
              reqs.push(
                RequestModel.findOneAndUpdate(
                  { code: values[1].toString().trim() },
                  { code: values[2].toString().trim() },
                  { lean: true, session }
                ).exec()
              );
            }
          });
          const results = await Promise.all(reqs);
          results.forEach(result => {
            if (result) {
              codes.push(result.code);
            }
          });
        })
        .then(() => {
          console.log("Transaction committed.");
          session.endSession();
          return res.status(HttpStatus.OK).send({
            message: "File uploaded successfully",
            success: codes
          });
        })
        .catch(err => {
          console.log("Transaction aborted. Error:", err);
          session.endSession();
          return next(err);
        });
    } catch (err) {
      return next(err);
    }
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (req.rawBody) {
    return new Promise<void>(resolve => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      busboy.end(req.rawBody, () => {
        return resolve();
      });
    });
  } else {
    req.pipe(busboy);
  }
};

interface UserInput {
  name: string;
  phone: string;
  password: string;
  role?: string;
  email: null | string;
  nationalId: string | null;
}

export const addUsersUsingCsv: ExpressFunc = (req, res, next) => {
  try {
    if (!req.headers["content-type"])
      return res.status(HttpStatus.BAD_REQUEST).send({
        error: "Invalid file",
        code: "invalid_upload_file"
      });
    const bb = Busboy({ headers: req.headers });

    bb.on("file", async (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      try {
        // Log start
        LoggerService.Create({
          userId: res.locals.user.userId,
          action: req.method as string,
          resource: req.originalUrl,
          type: "info",
          payload: {
            name: "Add users media endpoint",
            file: `File [${name}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`
          },
          userAgent: req.get("user-agent") ?? "unknown"
        });
        await workbook.xlsx.read(file);
        const ws = workbook.getWorksheet(1);
        if (!ws) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: "Empty excel sheet! Couldn't get worksheet",
            error: "excel.empty"
          });
        }
        const users: Array<UserInput> = [];

        // Loop over rows that have values in them.
        ws.eachRow(async (row, rowNum) => {
          if (rowNum === 1 || row.actualCellCount < 1) return; // ignore head and empty values
          users.push({
            name: row.getCell(1).value as unknown as string,
            phone: row.getCell(2).value as unknown as string,
            password: row.getCell(3).value?.toString() ?? "123456",
            email: row.getCell(4).value?.toString() ?? null,
            nationalId: row.getCell(5).value?.toString() ?? null
          });
        });

        // Hash users passwords
        users.map(async user => {
          user.password = (await hashPassword(user.password)) || "123456";
        });

        const data = await UserModel.insertMany(users, { lean: true });
        return res
          .status(HttpStatus.OK)
          .json({ data, message: ErrorMessage.SUCCESS_ACTION });
      } catch (err) {
        return next(err);
      }
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (req.rawBody) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bb.end(req.rawBody);
    } else {
      req.pipe(bb);
    }
  } catch (err) {
    next(err);
  }
};

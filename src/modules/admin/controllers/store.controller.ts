import gpxParser from "mahaseel-gpxparser";
import Busboy from "busboy";
import path from "path";
import os from "os";
import fs from "fs";
import util from "util";
import { Request, Response, NextFunction } from "express";
import mongoose, { PipelineStage } from "mongoose";
import { StoreModel } from "../../../models";
import { ErrorMessage } from "../../../assets/errors";
import { isPositiveNumber } from "../../../utils";
import { escapeString, isObjectId } from "../../../helpers";

export const addStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = req.body.code;
    const name = req.body.name;
    const storeType = req.body.storeType;
    const owner = req.body.owner;
    const phone = req.body.phone;
    const requestedBy = req.body.requestedBy;
    const ownerType = req.body.ownerType;
    const crop = req.body.crop;
    const governorate = req.body.governorate;
    const center = req.body.center;
    const hamlet = req.body.hamlet;
    const ownerPhone = req.body.ownerPhone;
    const store = new StoreModel({
      code: code,
      name: name,
      type: storeType,
      requestedBy: requestedBy,
      owner: owner,
      phone: phone,
      ownerPhone: ownerPhone,
      ownerType: ownerType,
      user: new mongoose.Types.ObjectId(res.locals.user.userId),
      crop: new mongoose.Types.ObjectId(crop),
      coordinates: { lat: null, lng: null },
      location: {
        governorate: new mongoose.Types.ObjectId(governorate),
        center: new mongoose.Types.ObjectId(center),
        hamlet: new mongoose.Types.ObjectId(hamlet)
      }
    });

    await store.save();

    res.json({ message: "Store Added Succesfully" });
  } catch (err) {
    next(err);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
    const aggregate: Array<PipelineStage> = [
      {
        $match: filterSearch(req.query)
      },
      {
        $project: {
          code: 1,
          name: 1,
          requestedBy: 1,
          owner: 1,
          type: 1,
          createdAt: 1,
          certificate: 1
        }
      },
      {
        $sort: {
          // TODO: Clean this!
          [req.headers.sortby as string]: req.headers.sortvalue
            ? (parseInt(req.headers.sortvalue.toString()) as -1 | 1)
            : (1 as const)
        }
      },
      { $limit: limit },
      { $skip: skip }
    ];

    const data = await StoreModel.aggregate(aggregate);
    if (!data) {
      res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const one = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const store = await StoreModel.findById(storeId)
      .populate("crop", `-varieties -createdAt -updatedAt`)
      .populate({
        path: "location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "location.center",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "location.hamlet",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate("user", `-accessToken -password`)
      .lean()
      .exec();
    res.json({ data: store });
  } catch (err) {
    next(err);
  }
};

const filterSearch = (body: {
  name?: string;
  governorate?: string;
  code?: string;
  crop?: string;
  ownerPhone?: string;
  owner?: string;
  today?: boolean;
}) => {
  const filter: Record<string, Record<string, string | Date | unknown>> = {};
  if (body.name) {
    filter["name"] = { $eq: body.name };
  }
  if (body.governorate) {
    filter["location.governorate"] = {
      $eq: new mongoose.Types.ObjectId(body.governorate)
    };
  }
  if (body.code) {
    filter["code"] = { $eq: body.code };
  }
  if (body.crop && isObjectId(body.crop)) {
    filter["crop"] = { $eq: new mongoose.Types.ObjectId(body.crop) };
  }
  if (body.owner) {
    filter["owner"] = { $regex: escapeString(body.owner) };
  }
  if (body.ownerPhone) {
    filter["ownerPhone"] = { $regex: escapeString(body.ownerPhone) };
  }
  if (body.today) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter["createdAt"] = { $gte: today };
  }

  return filter;
};

export const Gpx = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["content-type"]) {
    res.status(500).send({
      error: "Invalid file",
      code: "invalid_upload_file"
    });
  }
  const readFile = util.promisify(fs.readFile);
  const code = req.params.code;
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
  const gpxPars = new gpxParser(); // Create gpxParser Object
  busboy.on("file", async (_, file, info) => {
    const { encoding, mimeType: mimetype } = info;
    let filename = info.filename;
    console.log(
      `Process File: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
    );
    filename = newfile.concat(filename);
    filepath = path.join(tmpdir, filename);
    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    // On finish of the upload
    writeStream.on("close", async () => {
      console.log(`Upload of '${filename}' finished`);
      readFile(filepath)
        .then(async data => {
          gpxPars.parse(data);
          const codeIndex = gpxPars.waypoints.findIndex(
            reqItem => reqItem.name === code
          );
          const gpxTimestamp = new Date(gpxPars.waypoints[codeIndex].time);
          const gpxOriginalDate = new Date(gpxPars.waypoints[codeIndex].time);
          if (codeIndex === -1) {
            return res.status(409).json({ message: "code Not Found in gpx" });
          }
          // console.log(gpxPars.waypoints[codeIndex].time)
          // const lat = gpxPars.waypoints[codeIndex].lat
          // const lng = gpxPars.waypoints[codeIndex].lon
          // const gotData = "time is "+gpxPars.waypoints[codeIndex].time + " ,lat ="+gpxPars.waypoints[codeIndex].lat+" ,lng = " +gpxPars.waypoints[codeIndex].lon
          const result = await StoreModel.findOneAndUpdate(
            { code: code },
            {
              "coordinates.lng": gpxPars.waypoints[codeIndex].lon,
              "coordinates.lat": gpxPars.waypoints[codeIndex].lat,
              gpxTimestamp: gpxTimestamp,
              gpxOriginalDate: gpxOriginalDate
            },
            { lean: true }
          );
          if (result) {
            const data = await StoreModel.findOne({ code: code });
            if (!data)
              return res
                .status(409)
                .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
            return res.json(data.coordinates);
          } else {
            return res
              .status(409)
              .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
          }
        })
        .catch(err => {
          next(err);
        });
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

export const dateUpdate = async (req: Request, res: Response) => {
  const code = req.params.code;
  const updatedYear = req.body.gpxTimestamp;
  const newGpxTimestamp = new Date(updatedYear + "-03-03");
  StoreModel.findOneAndUpdate(
    { code: code },
    { gpxTimestamp: newGpxTimestamp },
    { new: true, lean: true }
  )
    .then(async result => {
      if (result) {
        return res.json("Updated gpxTimestamp");
      } else {
        return res
          .status(409)
          .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    });
};

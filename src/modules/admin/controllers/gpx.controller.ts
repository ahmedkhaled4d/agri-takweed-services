import Busboy from "busboy";
import type { NextFunction, Request, Response } from "express";
import gpxParser from "mahaseel-gpxparser";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { ObjectId } from "../../../helpers";
import { GeometryModel, Polygon, RequestDocument } from "../../../models";
import * as LoggerService from "../../../repositories/logger.repository";
import { requestRepo } from "../../../repositories/request.repository";
import { uploadToGCPBuffer } from "../../../services";
import type { Gpx as IGpx, Point } from "../../../types";
import { isPositiveNumber, roundToTwo } from "../../../utils";
import { updateCharge } from "../services/domain/traceability.service";
import {
  calculatePolygonArea,
  getIntersection
} from "../services/gpx.services";

const checkPiece = (reqGpx: Array<IGpx>, feature: string) => {
  for (let i = 0; i < reqGpx.length; i++) {
    if (feature.length < 15) {
      if (reqGpx[i].name_ar === feature.slice(-4, -3)) {
        return false;
      }
    } else {
      if (reqGpx[i].name_ar === feature.slice(-5, -3)) {
        return false;
      }
    }
  }
  return true;
};

export const Gpx = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["content-type"]) {
    res.status(HttpStatus.BAD_REQUEST).send({
      error: "Invalid file",
      code: "invalid_upload_file"
    });
  }
  const code = req.params.code;

  if (!code)
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: ErrorMessage.INVALID_PARAMS });

  // make sure request is there
  const request = await requestRepo.findByCode(code, { lean: false });

  if (!request)
    return res
      .status(HttpStatus.NOT_FOUND)
      .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 0.5 * 1024 * 1024, // max image size to 2 MB
      files: 1 // Limit to one file upload
    }
  });

  busboy.on("file", (name, file, info) => {
    const gpxPars = new gpxParser(); // Create gpxParser Object
    const gpxArray: Array<IGpx> = [];
    const { mimeType: mimetype, filename, encoding } = info;
    console.log(
      `Process File: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
    );

    // Wait till file is uploaded
    const chuncks: Array<Uint8Array> = [];
    file.on("data", data => {
      chuncks.push(data);
    });

    file.on("error", err => next(err));

    file.on("end", async () => {
      try {
        // Don't block
        LoggerService.Create({
          userId: res.locals.user.userId,
          action: req.method as string,
          resource: req.originalUrl,
          type: "info",
          payload: {
            message: `Processing GPX file code:${code}`,
            name,
            info
          },
          userAgent: req.get("user-agent") ?? "unknown"
        });

        // Get file
        const buffer = Buffer.concat(chuncks);

        gpxPars.parse(buffer);
        const geoJSON = gpxPars.toGeoJSON();
        const dateIndex = gpxPars.waypoints.findIndex(
          reqItem => reqItem.name.substring(0, 10) === code
        );

        // If not found then stop
        if (dateIndex < 0)
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json({ error: true, message: "Code Doesnt match!" });

        // In case of date not found
        if (!gpxPars.waypoints[dateIndex].time)
          return res
            .status(HttpStatus.NOT_ACCEPTABLE)
            .json({ error: true, message: "Cannot Grap Date" });

        const gpxTimestamp = new Date(gpxPars.waypoints[dateIndex].time);

        const gpxOriginalDate = gpxTimestamp;

        // Archive the file, don't block
        uploadToGCPBuffer(
          new Date().toISOString() + "_" + code + "_" + filename,
          buffer,
          "gs://takweed-gpx-archive"
        );

        const filteredFeatures = geoJSON.features.filter(feature => {
          // NOTE: Sometimes the name is not there?
          return feature.properties?.name?.substring(0, 10) === code;
        });

        filteredFeatures.sort((a, b) => {
          return a.properties?.name?.localeCompare(b.properties?.name);
        });

        // There is a precheck for this, but just in case
        if (filteredFeatures.length === 0) {
          LoggerService.Create({
            userId: res.locals.user.userId,
            action: req.method as string,
            resource: req.originalUrl,
            type: "error",
            payload: {
              message: `Processing GPX file code:${code}, FATAL ERROR! DATE GUARD CHECK FOR CODE FAILED`,
              gpx: geoJSON
            },
            userAgent: req.get("user-agent") ?? "unknown"
          });

          return res.status(HttpStatus.BAD_REQUEST).json({
            error: true,
            message:
              "Code Doesnt match! (This shouldnt happen! as there is a precheck)"
          });
        }

        /**
         * TODO: Check that its fixed
         * TODO: Migrate to a better solution like using Maps (hashmap ftw) or Sets
         * WARN: cannot read property 'slice' of undefined
         * if the file has a point which is like 0B-02
         * After 0A, it gets merged
         * Need a way to validate that the point is not merged
         * and stop the process on missing points?
         */
        filteredFeatures.some(feature => {
          // some stops on true, while forEach doesn't
          const pointNum = feature.properties?.name.slice(-2);

          // check for a new geometry (01A, 01B for example)
          if (pointNum === "01") {
            // Get the first point properties
            const temp: IGpx = {
              name_ar: "",
              variety: null,
              points: [],
              area: 0
            };
            if (feature.properties?.name.length < 15) {
              temp.name_ar = feature.properties?.name.slice(-4, -3);
            } else {
              temp.name_ar = feature.properties?.name.slice(-5, -3);
            }
            temp.points = [
              {
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0]
              }
            ];
            gpxArray.push(temp as IGpx);
          } else {
            if (gpxArray.length === 0) {
              return res.status(HttpStatus.BAD_REQUEST).json({
                error: "missing_first_point",
                mesage: "Invalid GPX file, missing first point."
              });
            }
            gpxArray[gpxArray.length - 1].points?.push({
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0]
            });
          }
        });

        // check if response is sent
        if (res.headersSent) return;

        let totalArea = 0;
        const gpx = gpxArray;

        gpxArray.some((polygon: IGpx) => {
          polygon?.name_ar?.toUpperCase();
          polygon.area = calculatePolygonArea(polygon.points ?? []);
          if (!isPositiveNumber(polygon.area)) {
            // area must be positive
            res.status(400).json({
              message:
                "Invalid GPX file, area isn't positive. please check the file and try again"
            });
            return true;
          }
          totalArea += polygon.area;
          return false;
        });

        // check if response is sent
        if (res.headersSent) return;

        totalArea = roundToTwo(totalArea);

        let visitsNumber = request.visitsNumber ?? 1;
        // how many times this farm has been visited
        if (request?.gpxOriginalDate?.getTime() !== gpxOriginalDate.getTime())
          visitsNumber = request.visitsNumber ? ++request.visitsNumber : 1;

        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const [updatedReq, _deleted] = await Promise.all([
          requestRepo.findByCodeAndUpdate(
            code,
            {
              gpx: gpxArray,
              totalArea,
              gpxTimestamp,
              gpxOriginalDate,
              adminUser: res.locals.user.userId,
              visitsNumber: visitsNumber
            },
            { new: true, runValidators: true }
          ),
          GeometryModel.deleteMany({ "polygons.code": code })
        ]);

        const Geometries = [];

        for (let j = 0; j < gpx.length; j++) {
          // Group the points into a polygon
          const land =
            gpx[j].points?.map((point: Point) => {
              return [point.lat, point.lng];
            }) || [];

          Geometries.push({
            polygons: {
              type: "Polygon",
              crop: ObjectId(updatedReq.crop),
              code: updatedReq.code,
              gpxDate: updatedReq.gpxTimestamp,
              farmName: updatedReq.farm.name,
              owner: updatedReq.farm.owner,
              point: updatedReq.gpx[j].name_ar,
              coordinates: [land],
              intersections: [],
              area: updatedReq.gpx[j].area
            }
          });
        }

        await GeometryModel.insertMany(Geometries);

        const promiseToGetIntersections = getIntersection(code);

        res
          .status(HttpStatus.OK)
          .json({ message: "GPX nweRequest updated!", data: request });
        return promiseToGetIntersections;
      } catch (err) {
        next(err);
      }
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

export const GpxUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code = req.params.code;
  const { gpx } = req.body;
  // This code will process each file uploaded.
  if (!gpx || !Array.isArray(gpx))
    return res
      .status(HttpStatus.CONFLICT)
      .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
  try {
    const request = await requestRepo.findByCode(code, { lean: false });
    if (request) {
      const updatedGPX = request.gpx.map(
        (itemFromDB: RequestDocument["gpx"][number]) => {
          const temp = gpx.find(
            newItem =>
              newItem.name_ar === itemFromDB.name_ar &&
              newItem.points.length > 2
          );
          if (temp) {
            itemFromDB.variety = temp.variety;
            itemFromDB.points = temp.points;
            itemFromDB.area = calculatePolygonArea([...temp.points]);
            itemFromDB.carbonFootprint = temp.carbonFootprint;
          }
          return itemFromDB;
        }
      );

      let totalArea = 0;
      updatedGPX.forEach((polygon: IGpx) => {
        polygon.area = calculatePolygonArea(polygon.points as [Point]);
        totalArea += polygon.area;
      });
      // Don't await (Don't block the event loop)
      updateCharge(code, updatedGPX);
      totalArea = roundToTwo(totalArea);
      await GeometryModel.deleteMany({ "polygons.code": code });

      const Geometries: Array<{ polygons: Polygon }> = [];
      for (let j = 0; j < updatedGPX.length; j++) {
        const land: Array<Array<number>> = [];
        updatedGPX[j]?.points?.map((el: Point) => {
          land.push([el.lat, el.lng]);
        });
        const gpxInter = request.gpxOriginalDate ?? request.gpxTimestamp;
        Geometries.push({
          polygons: {
            type: "Polygon",
            crop: ObjectId(request.crop),
            code: request.code,
            gpxDate: gpxInter ?? new Date(),
            season: gpxInter ?? new Date(),
            farmName: request.farm.name,
            owner: request.farm.owner,
            point: updatedGPX[j].name_ar,
            area: updatedGPX[j].area,
            coordinates: [land],
            intersections: []
          }
        });
      }
      await GeometryModel.insertMany(Geometries);
      await requestRepo.findByIdAndUpdate(request._id, {
        gpx: updatedGPX,
        totalArea
      });
      await getIntersection(request.code);
      return res.status(HttpStatus.OK).json(request.gpx);
    }
  } catch (error) {
    //
    console.log(error);
    next(error);
  }
};

export const appendGPX = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers["content-type"]) {
    res.status(HttpStatus.BAD_REQUEST).send({
      error: "Invalid file",
      code: "invalid_upload_file"
    });
  }
  const code = req.params.code;

  if (!code)
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: ErrorMessage.INVALID_PARAMS });

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 0.5 * 1024 * 1024, // max image size to 2 MB
      files: 1 // Limit to one file upload
    }
  });

  busboy.on("file", (name, file, info) => {
    const gpxPars = new gpxParser(); // Create gpxParser Object
    const gpxArray: Array<IGpx> = [];
    const { mimeType: mimetype, filename, encoding } = info;
    console.log(
      `Process Req ${code} File: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
    );

    // Wait till file is uploaded
    const chuncks: Array<Uint8Array> = [];
    file.on("data", data => {
      chuncks.push(data);
    });

    file.on("error", err => next(err));

    file.on("end", async () => {
      const request = await requestRepo.findByCode(code, { lean: false });

      if (!request)
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

      // Don't block
      LoggerService.Create({
        userId: res.locals.user.userId,
        action: req.method as string,
        resource: req.originalUrl,
        type: "info",
        payload: {
          message: `Processing GPX file code:${code}`,
          name,
          info
        },
        userAgent: req.get("user-agent") ?? "unknown"
      });

      // Get file
      const buffer = Buffer.concat(chuncks);

      gpxPars.parse(buffer);
      const geoJSON = gpxPars.toGeoJSON();

      if (!request) {
        return res.status(404).json({ message: "Cannot find the request" });
      }

      // Archive the file
      uploadToGCPBuffer(
        new Date().toISOString() + "_" + code + "_" + filename,
        buffer,
        "gs://takweed-gpx-archive"
      );

      const filteredFeatures = geoJSON.features.filter(feature => {
        return (
          feature.properties?.name.substring(0, 10) === code &&
          checkPiece(request.gpx, feature.properties?.name) === true
        );
      });

      filteredFeatures.sort((a, b) => {
        return a.properties?.name.localeCompare(b.properties?.name);
      });
      for (let i = 0; i < filteredFeatures.length; i++) {
        const pointNum = filteredFeatures[i].properties?.name.slice(-2);
        // check for a new geometry (New Plot(piece))
        if (pointNum === "01") {
          const temp: IGpx = {
            name_ar: "",
            variety: null,
            points: [],
            area: 0
          };
          if (filteredFeatures[i].properties?.name.length < 15) {
            temp.name_ar = filteredFeatures[i].properties?.name.slice(-4, -3);
          } else {
            temp.name_ar = filteredFeatures[i].properties?.name.slice(-5, -3);
          }
          temp.points = [
            {
              lat: filteredFeatures[i].geometry.coordinates[1],
              lng: filteredFeatures[i].geometry.coordinates[0]
            }
          ];
          gpxArray.push(temp);
        } else {
          gpxArray[gpxArray.length - 1].points?.push({
            lat: filteredFeatures[i].geometry.coordinates[1],
            lng: filteredFeatures[i].geometry.coordinates[0]
          });
        }
      }
      let totalArea = 0;
      const gpx = gpxArray;
      gpxArray.forEach(polygon => {
        polygon.area = calculatePolygonArea(polygon.points ?? []);
        totalArea += polygon.area;
      });
      totalArea = roundToTwo(totalArea);

      await GeometryModel.deleteMany({ "polygons.code": code });

      const newReq = await requestRepo.findByCodeAndUpdate(
        code,
        {
          $push: { gpx: { $each: gpxArray } },
          $inc: { totalArea: totalArea },
          adminUser: res.locals.user.userId
        },
        { new: true }
      );

      const Geometries = [];
      for (let j = 0; j < gpx.length; j++) {
        const land: Array<Array<number>> = [];
        gpx[j].points?.map((point: Point) => {
          land.push([point.lat, point.lng]);
        });

        Geometries.push({
          polygons: {
            type: "Polygon",
            crop: ObjectId(newReq.crop),
            code: newReq.code,
            gpxDate: newReq.gpxTimestamp,
            farmName: newReq.farm.name,
            owner: newReq.farm.owner,
            point: newReq.gpx[j].name_ar,
            coordinates: [land],
            intersections: [],
            area: newReq.gpx[j].area
          }
        });
      }
      GeometryModel.insertMany(Geometries);

      getIntersection(code);

      return res.json({ message: "GPX newReq updated!", data: request });
    });
  });

  busboy.on("error", err => next(err));

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

export const dateUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = req.params.code;
    const updatedYear = req.body.gpxTimestamp;
    if (!updatedYear)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });

    const newGpxTimestamp = new Date(updatedYear + "-03-03");

    const request = await requestRepo.findByCode(code, { lean: false });

    if (!request)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    if (!request.gpxOriginalDate)
      request.gpxOriginalDate = request.gpxTimestamp;
    request.gpxTimestamp = newGpxTimestamp;

    await request.save();

    return res.status(HttpStatus.OK).json({ message: "Updated gpxTimestamp" });
  } catch (err) {
    next(err);
  }
};

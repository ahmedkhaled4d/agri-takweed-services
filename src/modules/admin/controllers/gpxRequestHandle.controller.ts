import type { NextFunction, Request, Response } from "express";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import * as LoggerService from "../../../repositories/logger.repository";
import { GeometryModel, Polygon } from "../../../models";
import { requestRepo } from "../../../repositories/request.repository";
import { Gpx, Point } from "../../../types";
import { isPositiveNumber, roundToTwo } from "../../../utils";
import { isValidDate } from "../../../utils/date.pipline";
import { calculatePolygonArea, getIntersection } from "../services";
import { ObjectId } from "../../../helpers";
import { gpxFlags, gpxMessages } from "../../../assets/strings";

// update and do what you want here.
export const addGpxToRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = req.params.code;
    const body = req.body;
    // This code will process each file uploaded.
    if (!body)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    const request = await requestRepo.findByCode(code);

    if (!request) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Request Not found" });
    }

    if (!Array.isArray(body.gpx)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid GPX" });
    }

    if (!isValidDate(body.date)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid Date" });
    }

    let message = "";
    const hasPolygonErrors = body.gpx.some((polygon: Gpx) => {
      if (!polygon.variety) {
        message = "Missing Varieties";
        return true;
      }
      if (!polygon.name_ar) {
        message = "Missing Polygon Name";
        return true;
      }
      if (!polygon.points || polygon.points.length === 0) {
        message = "Missing Polygon Points";
      }
      if (!polygon.area || !isPositiveNumber(polygon.area)) {
        message = "Missing Polygon Area";
        return true;
      }
      if (polygon.points.length < 3) {
        message = "Invalid Polygon Points";
        return true;
      }
      return false;
    });

    if (hasPolygonErrors) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message });
    }

    // Being working on the request now.
    request.gpx = body.gpx;
    const gpxOriginalDate = new Date(body.date);

    let totalArea = 0;
    request.gpx.forEach((polygon: Gpx) => {
      polygon.area = calculatePolygonArea(polygon.points as [Point]);
      // area must be positive
      if (!isPositiveNumber(polygon.area)) {
        message = gpxMessages.BAD_AREA(polygon.name_ar, polygon.area);
      }
      totalArea += polygon.area;
    });
    if (message !== "") {
      return res.status(HttpStatus.BAD_REQUEST).json({ message });
    }
    totalArea = roundToTwo(totalArea);

    let visitsNumber = request.visitsNumber ?? 1;

    if (request?.gpxOriginalDate?.getTime() !== gpxOriginalDate.getTime())
      visitsNumber = request.visitsNumber ? ++request.visitsNumber : 1;

    const newReq = await requestRepo.findByIdAndUpdate(request._id, {
      gpx: request.gpx,
      gpxTimestamp: gpxOriginalDate,
      gpxOriginalDate: gpxOriginalDate,
      totalArea,
      adminUser: res.locals.user.userId,
      visitNumber: visitsNumber
    });

    if (!newReq) {
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: "Update Failed!" });
    }

    // Prepare for new Plots and intersections
    await GeometryModel.deleteMany({ "polygons.code": code });

    const Geometries: Array<{ polygons: Polygon }> = [];
    for (let j = 0; j < request.gpx.length; j++) {
      const land: Array<Array<number>> = [];
      request.gpx[j]?.points?.map((el: Point) => {
        land.push([el.lat, el.lng]);
      });
      Geometries.push({
        polygons: {
          type: "Polygon",
          crop: ObjectId(request.crop),
          code: request.code,
          gpxDate: new Date(gpxOriginalDate),
          season: gpxOriginalDate,
          farmName: request.farm.name,
          owner: request.farm.owner,
          point: request.gpx[j].name_ar,
          area: request.gpx[j].area,
          coordinates: [land],
          intersections: []
        }
      });
    }
    await GeometryModel.insertMany(Geometries);

    await getIntersection(request.code);
    return res.status(HttpStatus.OK).json({ data: request.gpx });
  } catch (err) {
    next(err);
  }
};

export const validateGpxPayload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body;
    // This code will process each file uploaded.
    if (!body || !Array.isArray(body))
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: ErrorMessage.NO_RESOURCE_FOUND,
        error: "BODY_NOT_ARRAY"
      });

    const errors: Array<{
      message: string;
      index?: number;
      polygonIndex?: string;
      error: string;
    }> = [];

    body.map((item, index) => {
      if (!item.code) {
        errors.push({
          message: gpxMessages.MISSING_CODE,
          index: index,
          error: gpxFlags.MISSING_CODE
        });
      }

      if (!item.date) {
        errors.push({
          message: gpxMessages.MISSING_DATE,
          index: index,
          error: gpxFlags.INVALID_DATE
        });
      }

      item.gpx.map((polygon: Gpx) => {
        if (!polygon.variety) {
          errors.push({
            message: gpxMessages.MISSING_VARIETIES,
            index: index,
            polygonIndex: item.gpx.indexOf(polygon),
            error: gpxFlags.MISSING_VARIETIES
          });
        }
        if (!polygon.name_ar) {
          errors.push({
            message: gpxMessages.MISSING_POLYGON_NAME,
            index: index,
            polygonIndex: item.gpx.indexOf(polygon),
            error: gpxFlags.MISSING_POLYGON_NAME
          });
        }
        if (!polygon.points || polygon.points.length === 0) {
          errors.push({
            message: gpxMessages.MISSING_POLYGON_POINTS,
            index: index,
            polygonIndex: item.gpx.indexOf(polygon),
            error: gpxFlags.MISSING_POLYGON_POINTS
          });
        }
        if (!polygon.area || !isPositiveNumber(polygon.area)) {
          errors.push({
            message: gpxMessages.MISSING_POLYGON_AREA,
            index: index,
            polygonIndex: item.gpx.indexOf(polygon),
            error: gpxFlags.MISSING_POLYGON_AREA
          });
        }
        if (polygon.points.length < 3) {
          errors.push({
            message: gpxMessages.LOW_POLYGON_POINTS,
            index: index,
            polygonIndex: item.gpx.indexOf(polygon),
            error: gpxFlags.LOW_POLYGON_POINTS
          });
        }
      });

      item.gpx.forEach((polygon: Gpx) => {
        polygon.area = calculatePolygonArea(polygon.points as [Point]);
        // area must be positive
        if (!isPositiveNumber(polygon.area)) {
          errors.push({
            message: gpxMessages.BAD_AREA(polygon.name_ar, polygon.area),
            index: index,
            polygonIndex: item.gpx.indexOf(polygon),
            error: gpxFlags.BAD_AREA
          });
        }
      });
    });
    return res.status(HttpStatus.OK).json({
      message: errors.length === 0 ? "Valid Payload" : "Invalid Payload",
      error: errors.length === 0 ? false : true,
      errors
    });
  } catch (err) {
    next(err);
  }
};

export const generateGpxFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (Array.isArray(req.body) && req.body.length > 0) {
      const filename = req.query.filename ?? req.body[0].code;
      // add spaces
      let gpxFileContent = `<?xml version="1.0" encoding="utf-8"?>
<gpx version="1.1" creator="Takweed Egypt System" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/ActivityExtension/v1 http://www8.garmin.com/xmlschemas/ActivityExtensionv1.xsd http://www.garmin.com/xmlschemas/AdventuresExtensions/v1 http://www8.garmin.com/xmlschemas/AdventuresExtensionv1.xsd http://www.garmin.com/xmlschemas/PressureExtension/v1 http://www.garmin.com/xmlschemas/PressureExtensionv1.xsd http://www.garmin.com/xmlschemas/TripExtensions/v1 http://www.garmin.com/xmlschemas/TripExtensionsv1.xsd http://www.garmin.com/xmlschemas/TripMetaDataExtensions/v1 http://www.garmin.com/xmlschemas/TripMetaDataExtensionsv1.xsd http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensions/v1 http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensionsv1.xsd http://www.garmin.com/xmlschemas/CreationTimeExtension/v1 http://www.garmin.com/xmlschemas/CreationTimeExtensionsv1.xsd http://www.garmin.com/xmlschemas/AccelerationExtension/v1 http://www.garmin.com/xmlschemas/AccelerationExtensionv1.xsd http://www.garmin.com/xmlschemas/PowerExtension/v1 http://www.garmin.com/xmlschemas/PowerExtensionv1.xsd http://www.garmin.com/xmlschemas/VideoExtension/v1 http://www.garmin.com/xmlschemas/VideoExtensionv1.xsd" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:wptx1="http://www.garmin.com/xmlschemas/WaypointExtension/v1" xmlns:gpxtrx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:trp="http://www.garmin.com/xmlschemas/TripExtensions/v1" xmlns:adv="http://www.garmin.com/xmlschemas/AdventuresExtensions/v1" xmlns:prs="http://www.garmin.com/xmlschemas/PressureExtension/v1" xmlns:tmd="http://www.garmin.com/xmlschemas/TripMetaDataExtensions/v1" xmlns:vptm="http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensions/v1" xmlns:ctx="http://www.garmin.com/xmlschemas/CreationTimeExtension/v1" xmlns:gpxacc="http://www.garmin.com/xmlschemas/AccelerationExtension/v1" xmlns:gpxpx="http://www.garmin.com/xmlschemas/PowerExtension/v1" xmlns:vidx1="http://www.garmin.com/xmlschemas/VideoExtension/v1">
  <metadata>
    <name>${req.body[0].code}</name>
    <link href="https://takweedegypt.com/">
      <text>Takweed Generated - ${filename}</text>
    </link>
  </metadata>

  `;

      // this is a promise all settled, so it will not throw an error.
      const promises = await Promise.allSettled(
        req.body.map(async item => {
          item.gpx.forEach((polygon: Gpx) => {
            polygon.points.forEach((point, index) => {
              // check if last point.
              if (polygon.points.length === index + 1) {
                if (
                  point.lat === polygon.points[0].lat &&
                  point.lng === polygon.points[0].lng
                ) {
                  // if the first point is the same as the last point, don't add it.
                  return;
                }
              }
              // add spaces before and after the wpt
              gpxFileContent += `
              <wpt lat="${point.lat}" lon="${point.lng}">
              <time>${item?.date ?? new Date().toISOString()}</time>
              <name>${item.code}${polygon.name_ar}-${Intl.NumberFormat(
                // format to 2 digits.
                "en-US",
                { minimumIntegerDigits: 2 }
              ).format(index + 1)}</name>\n
              <sym>Flag, Blue</sym>
              <type>user</type>
              <extensions>
                <gpxx:WaypointExtension>
                  <gpxx:DisplayMode>SymbolAndName</gpxx:DisplayMode>
                </gpxx:WaypointExtension>
                <wptx1:WaypointExtension>
                  <wptx1:DisplayMode>SymbolAndName</wptx1:DisplayMode>
                </wptx1:WaypointExtension>
                <ctx:CreationTimeExtension>
                  <ctx:CreationTime>${item.date}</ctx:CreationTime>
                </ctx:CreationTimeExtension>
              </extensions>
              </wpt>`;
            });
          });
        })
      );

      // check if there is errors
      const hasErrors = promises.filter(item => item.status === "rejected");
      if (hasErrors.length > 0) {
        LoggerService.Create({
          userId: res.locals.user.userId,
          action: req.method as string,
          resource: req.originalUrl,
          type: "error",
          payload: {
            status: HttpStatus.CONFLICT,
            message: "Failed to process GPX payload, will continue normally",
            hasErrors
          },
          userAgent: req.get("user-agent") ?? "unknown"
        });
      }

      gpxFileContent += "</gpx>";
      // return file to user
      res.setHeader("Content-Type", "application/gpx+xml");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" +
          `${filename.includes(".gpx") ? filename : filename + ".gpx"}`
      );

      res.type("gpx");

      // convert to buffer
      const buffer = Buffer.from(gpxFileContent, "utf-8");
      return new Promise<void>(resolve => {
        res.writeHead(HttpStatus.OK);
        res.end(buffer, () => {
          resolve();
        });
      });
    }
    return res
      .status(HttpStatus.OK)
      .json({ message: "Send array, nothing to do." });
  } catch (err) {
    next(err);
  }
};

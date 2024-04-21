import Busboy from "busboy";
import * as crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import gpxParser from "mahaseel-gpxparser";
import { HttpStatus } from "../../../assets/httpCodes";
import { gpxFlags, gpxMessages } from "../../../assets/strings";
import { checkHasRawBody } from "../../../helpers/firefunctions";
import * as LoggerService from "../../../repositories/logger.repository";
import { requestRepo } from "../../../repositories/request.repository";
import { uploadToGCPBuffer } from "../../../services";
import { Gpx, Waypoint } from "../../../types";
import { isPositiveNumber, roundToTwo } from "../../../utils";
import { isValidDate } from "../../../utils/date.pipline";
import { calculatePolygonArea } from "../services";
import { validateGpxObject } from "../services/gpx.view.service";

type flagsToBeSent = {
  flag: (typeof gpxFlags)[keyof typeof gpxFlags];
  message: string;
  piece: string | null;
  error: boolean;
};

// Don't update or do any actions here

/**
 * @description Creates an array of points from a GPX file
 *
 * Flow:
 * 1. User uploads a GPX file
 * 1. User checks the points and their names, modify as needed
 * 1. User sends payload to parse the points and get the area of each polygon. Validate etc.
 * 1. User can download the GPX file with the points and their names
 * 1. User can send the payload to the system to add the GPX to a request
 *
 * Request Flow:
 * 1. User sends multipart form data gpx file. File is parsed and returns points array.
 * 1. User can modify the points array and send it back to the system for parsing. User recieves array of requests objects.
 * 1. User sends the request object array to generate a GPX file with the points and their names.
 * 1. User can send the request object (One item only) to the system to add the GPX to a request
 */
export const ViewGpx = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers["content-type"]) {
    return res.status(HttpStatus.BAD_REQUEST).send({
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

  busboy.on("file", (keyName, file, info) => {
    const gpxPars = new gpxParser(); // Create gpxParser Object
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
        const buffer = Buffer.concat(chuncks);

        gpxPars.parse(buffer);

        const allPoints: Array<Waypoint & { _id: string }> = [];

        // Get all unique names
        const namesFound = gpxPars.waypoints
          .map(waypoint => {
            allPoints.push({
              _id: crypto.randomBytes(16).toString("hex"),
              name: waypoint.name,
              lat: waypoint.lat,
              lon: waypoint.lon,
              ele: waypoint.ele,
              time: waypoint.time as Date
            });
            return waypoint.name.length > 10
              ? waypoint.name.substring(0, 10)
              : waypoint.name;
          })
          .reduce((acc, curr) => {
            if (!acc.includes(curr)) acc.push(curr);
            return acc;
          }, [] as string[]);

        if (namesFound.length > 0) {
          // don't block
          uploadToGCPBuffer(
            new Date().toISOString() +
              "_" +
              namesFound.join("_") +
              "_" +
              filename,
            buffer,
            "gs://takweed-gpx-archive"
          );
        }

        // Don't block
        LoggerService.Create({
          userId: res.locals.user.userId,
          action: req.method as string,
          resource: req.originalUrl,
          type: "info",
          payload: {
            message: "Processing GPX file",
            keyName,
            info
          },
          userAgent: req.get("user-agent") ?? "unknown"
        });

        return res.status(HttpStatus.OK).json({
          names: namesFound,
          data: allPoints
        });
      } catch (err) {
        next(err);
      }
    });
  });

  if (checkHasRawBody(req)) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
};

// TODO: This literally does the same job as the one in gpx file controller. Refactor for code reuse.
// Only take the geoJSON and parse it?
export const ParseGpxObject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const gpxPars = validateGpxObject(req.body);

    if (
      "errors" in gpxPars &&
      gpxPars.errors?.filter(item => item.fatal).length
    ) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: "Invalid GPX Object",
        errors: gpxPars.errors
      });
    }
    if (!("waypoints" in gpxPars) || !("toGeoJSON" in gpxPars)) {
      return res.status(HttpStatus.CONFLICT).json({
        message: "Reached Impossible State!"
      });
    }

    const data: {
      code: string;
      crop?: string | null;
      date: Date | null;
      totalArea?: number;
      gpx: Gpx[];
      flags: flagsToBeSent[];
    }[] = [];

    const namesFound = gpxPars.waypoints
      .map(waypoint => {
        return waypoint.name.length > 10
          ? waypoint.name.substring(0, 10)
          : waypoint.name;
      })
      .reduce((acc, curr) => {
        if (!acc.includes(curr)) acc.push(curr);
        return acc;
      }, [] as string[]);

    const geoJSON = gpxPars.toGeoJSON();

    const promises = await Promise.allSettled(
      namesFound.map(async name => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const index = gpxPars.waypoints.findIndex(item => {
            return name.length === 10
              ? item.name.substring(0, 10) === name
              : item.name === name;
          });

          const date = index > -1 ? gpxPars.waypoints[index].time : null;

          let itemIndex = 0;

          // Check if date is valid
          if (!date || !isValidDate(date)) {
            itemIndex =
              data.push({
                code: name,
                date: null,
                totalArea: 0,
                gpx: [],
                flags: [
                  {
                    flag: gpxFlags.DATE_NOT_GRABBED,
                    piece: null,
                    message: gpxMessages.DATE_NOT_GRABBED,
                    error: true
                  }
                ]
              }) - 1;
          } else {
            itemIndex =
              data.push({
                code: name,
                totalArea: 0,
                date: new Date(date),
                gpx: [],
                flags: [
                  {
                    flag: gpxFlags.DATE_GRABBED,
                    piece: null,
                    message: gpxMessages.DATE_GRABBED,
                    error: false
                  }
                ]
              }) - 1;
          }

          try {
            let totalArea = 0;
            const gpxArray: Gpx[] = [];

            // treat as a request
            if (name.length === 10) {
              const filteredFeatures = geoJSON.features.filter(feature => {
                return feature.properties?.name?.substring(0, 10) === name;
              });

              filteredFeatures.sort((a, b) => {
                return a.properties?.name?.localeCompare(b.properties?.name);
              });

              const request = await requestRepo.findOne({ code: name });
              if (!request) {
                data[itemIndex].flags.push({
                  flag: gpxFlags.REQUEST_NOT_FOUND,
                  piece: null,
                  message: gpxMessages.REQUEST_NOT_FOUND,
                  error: true
                });
              }

              const gpxMap: Map<string, Gpx & { id: string }> = new Map();

              filteredFeatures.forEach(feature => {
                const pointNum = feature.properties?.name.slice(-2);

                if (pointNum === "01") {
                  const temp: Gpx & { id: string } = {
                    id: crypto.randomBytes(16).toString("hex"),
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
                      lng: feature.geometry.coordinates[0],
                      time: feature.properties?.date,
                      ele: feature.properties?.ele
                    }
                  ];
                  gpxMap.set(temp.name_ar, temp);
                } else {
                  const name_ar =
                    feature.properties?.name.length < 15
                      ? feature.properties?.name.slice(-4, -3)
                      : feature.properties?.name.slice(-5, -3);

                  const lastGpx = gpxMap.get(name_ar);
                  if (!lastGpx) {
                    data[itemIndex].flags.push({
                      flag: gpxFlags.MISSING_FIRST_POINT_OR_INVALID_GPX,
                      piece: name_ar,
                      message: gpxMessages.MISSING_FIRST_POINT_OR_INVALID_GPX,
                      error: true
                    });

                    const newGpx: Gpx & { id: string } = {
                      id: crypto.randomBytes(16).toString("hex"),
                      name_ar: name_ar,
                      variety: null,
                      points: [
                        {
                          lat: feature.geometry.coordinates[1],
                          lng: feature.geometry.coordinates[0],
                          time: feature.properties?.date,
                          ele: feature.properties?.ele
                        }
                      ],
                      area: 0
                    };

                    gpxMap.set(pointNum, newGpx);
                  } else {
                    lastGpx.points?.push({
                      lat: feature.geometry.coordinates[1],
                      lng: feature.geometry.coordinates[0],
                      time: feature.properties?.date,
                      ele: feature.properties?.ele
                    });
                  }
                }
              });

              // Convert Map values to array if needed
              const gpxArray = Array.from(gpxMap.values());

              gpxArray.forEach((polygon: Gpx) => {
                polygon?.name_ar?.toUpperCase();
                polygon.area = calculatePolygonArea(polygon.points ?? []);
                // area must be positive
                if (!isPositiveNumber(polygon.area))
                  // push to flags
                  data[itemIndex].flags.push({
                    flag: gpxFlags.BAD_AREA,
                    piece: polygon.name_ar,
                    message: gpxMessages.BAD_AREA(
                      polygon.name_ar,
                      polygon.area
                    ),
                    error: true
                  });
                else totalArea += polygon.area;
                // make sure that the polygon name_ar is unique.
                const len = gpxArray.filter(
                  item => item.name_ar != polygon?.name_ar
                ).length;
                if (len !== gpxArray.length - 1) {
                  data[itemIndex].flags.push({
                    flag: gpxFlags.DUPLICATE_NAME_AR,
                    piece: polygon?.name_ar,
                    message: gpxMessages.DUPLICATE_NAME_AR,
                    error: true
                  });
                }
              });

              totalArea = roundToTwo(totalArea);
              data[itemIndex].totalArea = totalArea;
              data[itemIndex].gpx = gpxArray;
              data[itemIndex].crop = request?.crop;
              filteredFeatures.sort((a, b) => {
                if (a.properties?.date && b.properties?.date)
                  return (
                    a.properties.date.getTime() - b.properties.date.getTime()
                  );
                return 0;
              });
              // get the waypoints date, the first point and last point
              // Unshift the last point first so it appears after first point
              data[itemIndex].flags.unshift({
                flag: gpxFlags.LAST_POINT_DATE,
                piece: null,
                message: gpxMessages.LAST_POINT_DATE(
                  filteredFeatures[filteredFeatures.length - 1]?.properties
                    ?.date
                ),
                error: false
              });
              data[itemIndex].flags.unshift({
                flag: gpxFlags.FIRST_POINT_DATE,
                piece: null,
                message: gpxMessages.FIRST_POINT_DATE(
                  filteredFeatures[0]?.properties?.date
                ),
                error: false
              });
              return resolve();
            }
            // else treat it as unknown.

            data[itemIndex].flags.push({
              flag: gpxFlags.UNKNOWN_CODE,
              piece: null,
              message: gpxMessages.UNKNOWN_CODE,
              error: true
            });

            const waypoints = gpxPars.waypoints.filter(waypoint => {
              return waypoint.name === name;
            });

            waypoints.sort((a, b) => {
              return a.name?.localeCompare(b.name);
            });

            waypoints.forEach(waypoint => {
              const pointNum =
                waypoint.name?.length > 2
                  ? waypoint.name?.slice(-2)
                  : "unknown-" + new Date().getTime().toString().slice(-4);

              gpxArray.push({
                name_ar: pointNum,
                variety: null,
                points: [
                  {
                    lat: waypoint.lat,
                    lng: waypoint.lon
                  }
                ],
                area: 0
              });
            });

            gpxArray.forEach((polygon: Gpx) => {
              polygon?.name_ar?.toUpperCase();
              polygon.area = calculatePolygonArea(polygon.points ?? []);
              // area must be positive
              if (!isPositiveNumber(polygon.area))
                // push to flags
                data[itemIndex].flags.push({
                  flag: gpxFlags.BAD_AREA,
                  piece: polygon.name_ar,
                  message: gpxMessages.BAD_AREA(polygon.name_ar, polygon.area),
                  error: true
                });
              else totalArea += polygon.area;
            });

            totalArea = roundToTwo(totalArea);
            data[itemIndex].totalArea = totalArea;
            data[itemIndex].gpx = gpxArray;
            return resolve();
          } catch (err) {
            data[itemIndex].flags.push({
              flag: gpxFlags.SYSTEM_COULD_NOT_PROCESS,
              piece: null,
              message: gpxMessages.SYSTEM_COULD_NOT_PROCESS,
              error: true
            });
            return reject(err);
          }
        });
      })
    );
    const promisesSettled = await Promise.allSettled(promises);

    const hasErrors = promisesSettled.filter(
      promise => promise.status === "rejected"
    );

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

    return res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
};

import type {
  NextFunction,
  Request as RequestExpress,
  Response
} from "express";
import { HttpStatus } from "../../../assets/httpCodes";
import { GeometryModel, RequestModel } from "../../../models";
import { ExpressFunc } from "../../../types";
import {
  generalReport,
  getAllGeoPlotsWithIntersectionsAgg,
  intersectionsReport,
  plotReportAggregation,
  pointsReport,
  reportShamalKolo,
  visitsReport
} from "../aggregations";
import { getTraceGeneralReport } from "../services/domain/traceability.service";
import {
  transformCrops,
  transformGovernorates,
  transformSeasons
} from "../helpers/transformers";
import { NumbersBySeasonYearReportAgg } from "../aggregations/reports/numbers.by.seasons.agg";

export const printVisitsReport = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, season, cropId, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "invalid body params , [startDate , endDate , season , cropId] "
      });
    }
    const report = await RequestModel.aggregate(
      visitsReport(
        startDate,
        endDate,
        transformSeasons(season),
        transformCrops(cropId),
        transformGovernorates(governorates)
      )
    );

    return res.status(HttpStatus.OK).json(report);
  } catch (error) {
    next(error);
  }
};

export const printPointsReport = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, season, cropId, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates) {
      res.status(400).json({
        message:
          "invalid body params , [startDate , endDate , season , cropId] "
      });
    }
    const report = await RequestModel.aggregate(
      pointsReport(
        startDate,
        endDate,
        transformSeasons(season),
        transformCrops(cropId),
        transformGovernorates(governorates)
      )
    );

    // This is done as we want the format to be as follows:
    // 23024052195A-01 (code + plot letter + plot index)
    const result = report.flatMap(
      ({ code, farmName, gpx, updatedAt, visitsNumber }) =>
        gpx.flatMap(
          ({
            name_ar,
            points,
            variety
          }: {
            name_ar: string;
            variety: string;
            points: Array<{ lat: number; lng: number }>;
          }) =>
            // Adds the code to the points
            points.map(({ lat, lng }, index) => ({
              // In case of 1 digit, add a 0 before it
              code: `${code}${name_ar}-${index < 9 ? "0" : ""}${index + 1}`,
              name: farmName,
              lat,
              lng,
              variety,
              updatedAt,
              NoOfVisits: visitsNumber
            }))
        )
    );

    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const printGeneralReport = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, season, cropId, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "invalid body params , [startDate , endDate , season , cropId, governorates] "
      });
    }
    const report = await RequestModel.aggregate(
      generalReport(
        startDate,
        endDate,
        transformSeasons(season),
        transformCrops(cropId),
        transformGovernorates(governorates)
      )
    );

    return res.status(HttpStatus.OK).json(report);
  } catch (error) {
    next(error);
  }
};

export const printIntersectionReport = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, season, cropId, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "invalid body params , [startDate , endDate , season , cropId, governorates] "
      });
    }
    const report = await GeometryModel.aggregate(
      intersectionsReport(
        startDate,
        endDate,
        transformSeasons(season),
        transformCrops(cropId),
        transformGovernorates(governorates)
      )
    );

    return res.status(HttpStatus.OK).json(report);
  } catch (error) {
    next(error);
  }
};

export const printPlotReport = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, cropId, season, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates)
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "invalid body params , [startDate , endDate, cropId, season, governorates ] "
      });

    const report = await RequestModel.aggregate(
      plotReportAggregation(
        transformCrops(cropId),
        startDate,
        endDate,
        transformSeasons(season),
        transformGovernorates(governorates)
      )
    );

    return res.status(HttpStatus.OK).json(report);
  } catch (error) {
    next(error);
  }
};

// الاصناف
export const getAllGeoPlots = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, cropId, season, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates)
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "invalid body params , [startDate , endDate, cropId, season, governorates ] "
      });

    const report = await RequestModel.aggregate(
      getAllGeoPlotsWithIntersectionsAgg({
        crops: transformCrops(cropId),
        seasons: transformSeasons(season),
        governorates: transformGovernorates(governorates),
        startDate,
        endDate
      })
    );

    // This is done to combine intersections
    // As we don't want arries or anything, must return flat.
    for (const item of report) {
      item.intersectionCount = 0;
      item.intersectionNames = "";

      if (item.intersection.length > 1) {
        const namesAr = item.intersection.map(
          (intersection: {
            name_ar: string;
            areaofintersection: number;
            percentofintersections: number;
          }) => intersection.name_ar
        );
        item.intersectionCount = item.intersection.length;
        item.intersectionNames = namesAr.join("_");
      }

      delete item.intersection;
    }

    return res.status(HttpStatus.OK).json(report);
  } catch (error) {
    next(error);
  }
};

export const requestTraceabilityGeneral: ExpressFunc = async (
  req,
  res,
  next
) => {
  try {
    const { year } = req.body;
    // if (!year)
    //   return res.status(HttpStatus.BAD_REQUEST).json({
    //     message: "invalid body params , [season, cropId ] "
    //   });
    const data = await getTraceGeneralReport(
      Number(year) || new Date().getFullYear() - 1
    );
    return res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
};

export const excelDataAllReport: ExpressFunc = async (req, res, next) => {
  try {
    const { startDate, endDate, season, cropId, governorates } = req.body;
    if (!startDate || !endDate || !cropId || !season || !governorates) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "invalid body params , [startDate , endDate , season , cropId] "
      });
    }
    let report = await RequestModel.aggregate(
      reportShamalKolo(
        startDate,
        endDate,
        transformSeasons(season),
        transformCrops(cropId),
        transformGovernorates(governorates)
      )
    );

    const intersectionsMap = new Map<string, number>();
    report = report.map(
      (item: {
        intersections?: Array<{
          intersections: Array<{
            code: string;
            area: number;
          }>;
        }>;
        intersectionCodes: string[];
        intersectionAreas: number[];
      }) => {
        // clear intersectionsMap
        intersectionsMap.clear();

        // check if there is no intersections
        if (item.intersections?.length === 0) {
          item.intersectionCodes = [];
          item.intersectionAreas = [];
          delete item.intersections;
          return item;
        }

        // Group intersections by code
        item.intersections?.forEach(intersection => {
          intersection.intersections.forEach(intersection => {
            const { code, area } = intersection;
            const currentArea = intersectionsMap.get(code) || 0;
            intersectionsMap.set(code, currentArea + area);
          });
        });
        // spread intersectionsMap into intersectionCodes and intersectionAreas
        item.intersectionCodes = Array.from(intersectionsMap.keys());
        item.intersectionAreas = Array.from(intersectionsMap.values());
        // delete intersections
        delete item.intersections;
        return item;
      }
    );

    return res
      .status(HttpStatus.OK)
      .json(report as unknown as Record<string, unknown>);
  } catch (error) {
    next(error);
  }
};

export const NumbersBySeasonYear = async (
  _req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const report = await RequestModel.aggregate(NumbersBySeasonYearReportAgg);

    return res.status(HttpStatus.OK).json(report);
  } catch (error) {
    next(error);
  }
};

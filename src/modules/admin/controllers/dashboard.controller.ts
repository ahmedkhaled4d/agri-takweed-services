import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { HttpStatus } from "../../../assets/httpCodes";
import { RequestModel, PostsModel } from "../../../models";
import type { ExpressFunc, Point } from "../../../types";
import { isPositiveNumber } from "../../../utils";
import {
  ChartData,
  CropsRequestById,
  LocationRequestsByGovId,
  LocationRequestsBySeason,
  PostsViewsAgg,
  ReportStatus,
  GetTwoMonthsAreas,
  PlotsCountAgg,
  RequestCrops,
  PlotTotalArea
} from "../aggregations";
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const Counters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const season = req.query.season;
    let date: string;

    if (season && !isNaN(Number(season))) {
      date = season.toString();
    } else {
      date = new Date().getFullYear().toString();
    }
    const [requests, requestsToday, farms, plotsTotalArea] = await Promise.all([
      RequestModel.countDocuments({
        createdAt: {
          $gte: new Date(`${date}-01-01`),
          $lt: new Date(`${date}-12-31`)
        }
      }),
      RequestModel.countDocuments({
        createdAt: { $gte: today }
      }),
      RequestModel.aggregate(PlotsCountAgg(date)),
      RequestModel.aggregate(PlotTotalArea(date))
    ]);

    return res.json({
      requestsToday: requestsToday,
      requests: requests,
      farms: farms.length >= 1 ? farms[0].plotsCount : 0,
      plotsTotalArea: plotsTotalArea.length >= 1 ? plotsTotalArea[0].amount : 0
    });
  } catch (error) {
    next(error);
  }
};

export const Charts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const date = isPositiveNumber(req.query.season)
      ? req.query.season.toString()
      : new Date().getFullYear().toString();
    return res.json(await RequestModel.aggregate(ChartData(date)));
  } catch (err) {
    next(err);
  }
};

export const RequestsByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let year = new Date().getFullYear() - 1;
    if (isPositiveNumber(req.query.season)) {
      year = Number(req.query.season);
    }
    return res.json(await RequestModel.aggregate(ReportStatus(year)));
  } catch (err) {
    next(err);
  }
};

export const RequestsByCrops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let year = new Date().getFullYear() - 1;
    if (isPositiveNumber(req.query.season)) {
      year = Number(req.query.season);
    }
    return res.json(await RequestModel.aggregate(RequestCrops(year)));
  } catch (error) {
    next(error);
  }
};

export const PostsViews = async (_: Request, res: Response) => {
  return res.json(await PostsModel.aggregate(PostsViewsAgg));
};

export const Locations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await RequestModel.aggregate(
      LocationRequestsByGovId(new mongoose.Types.ObjectId(req.params.gov))
    );
    if (!data) return res.status(404).json({ message: "Nothing found" });
    const result: Array<Point> = [];
    data.map(item => result.push({ lat: item._id.s0, lng: item._id.s1 }));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const Crops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await RequestModel.aggregate(
      CropsRequestById(new mongoose.Types.ObjectId(req.params.crop))
    );
    if (!data) return res.status(404).json({ message: "Nothing found" });
    const result: Array<Point> = [];
    data.map(item => result.push({ lat: item._id.s0, lng: item._id.s1 }));
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export const LocationsBySeason = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await RequestModel.aggregate(
      LocationRequestsBySeason(Number(req.params.season))
    );
    if (!data) return res.status(404).json({ message: "Nothing found" });
    const result: Array<Point> = [];
    data.map(item => result.push({ lat: item._id.s0, lng: item._id.s1 }));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const SparkLine: ExpressFunc = async (_req, res, next) => {
  try {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    const endDate = date;
    endDate.setDate(endDate.getDay() - 10);

    const SparkData = (await RequestModel.aggregate(
      GetTwoMonthsAreas
    )) as unknown as Array<{
      _id: null;
      data: Array<number>;
    }>;
    res.status(HttpStatus.OK).json({
      message: "works",
      error: false,
      data: SparkData.length >= 1 ? SparkData[0].data : []
    });
  } catch (err) {
    next(err);
  }
};

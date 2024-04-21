import type { NextFunction, Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { ErrorCode, ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { ObjectId, escapeString, isObjectId } from "../../../helpers";
import {
  CropModel,
  FarmModel,
  GeometryModel,
  RequestDocument,
  RequestModel,
  UserModel
} from "../../../models";
import DeletedModel from "../../../models/shared/deleted.model";
import { requestRepo } from "../../../repositories/request.repository";
import {
  HttpError,
  isCode,
  isNumeric,
  isPositiveNumber,
  mapErrorToResponse
} from "../../../utils";
import { getMahaseelEngCount, interseactoinsAgg } from "../aggregations";
import { ListRequests } from "../aggregations/request/general.agg";
import { yieldEstimate } from "../services/yield.estimation.service";

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? Math.abs(parseInt(req.headers.page.toString())) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
    const data = await RequestModel.aggregate(
      ListRequests({
        filter: filterQuery(req.query),
        skip,
        limit,
        sortby: req.headers.sortby,
        sortvalue: parseInt(req.headers.sortvalue as string) || -1
      })
    );
    if (!data) {
      return res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    let data;
    // Allow for access using Code or Id (Code is 10 characters)
    if (id.length < 12) {
      data = await requestRepo.getRequestDataByCode(id);
    } else {
      if (!isObjectId(id)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: ErrorMessage.INVALID_PARAMS });
      }
      data = await requestRepo.getRequestData(id);
    }
    // Handle if request not found
    if (!data)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Couldnt find request" });
    const [adminData, intersections] = await Promise.all([
      UserModel.findById(data.adminUser).lean().exec(),
      GeometryModel.aggregate(interseactoinsAgg(data.code))
    ]);
    // need to group by variety and add the plots and their area.
    // {
    //  items: [
    //    {
    //      variety: "variety",
    //      treeCount: 123,
    //      area: 123,
    //      plots: [
    //        {
    //          area: 123,
    //          piece: "A",
    //          expectedYield: "123",
    //          plantation_acreage: "123",
    //          cropAge?: 123
    //        }
    //      ]
    //    }
    //  ]
    // }
    const groupedVarieties = data.gpx.reduce((acc, curr, index) => {
      const item = acc.get(curr.variety);
      if (item) {
        item.treeCount += Math.round(
          curr.estimation?.total_trees || Math.random() * 100
        );
        item.area += curr.area;
        item.plots.push({
          area: curr.area,
          piece: curr.name_ar,
          plantation_acreage: curr.estimation?.plantation_acreage || "0 Ha",
          expectedYield: curr.estimation?.expected_yield || "0 Tonne",
          index,
          cropAge: curr.cropAge
        });
        acc.set(curr.variety, item);
        return acc;
      }
      acc.set(curr.variety, {
        variety: curr.variety,
        area: curr.area,
        treeCount: Math.round(
          curr.estimation?.total_trees || Math.random() * 100
        ),
        plots: [
          {
            area: curr.area,
            piece: curr.name_ar,
            index: index,
            plantation_acreage: curr.estimation?.plantation_acreage || "0",
            expectedYield: curr.estimation?.expected_yield || "0",
            cropAge: curr.cropAge
          }
        ]
      });
      return acc;
    }, new Map());
    if (!data) res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    const items = [];
    for (const item of groupedVarieties.values()) {
      items.push(item);
    }
    return res.send({
      data,
      intersections,
      adminData,
      items: items
    });
  } catch (error) {
    next(error);
  }
};

export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;

    const { status } = req.body;

    if (!status) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });
    }

    const data = await RequestModel.findByIdAndUpdate(
      ObjectId(Id),
      {
        ...(status && { status })
      },
      { new: true, lean: true }
    );

    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    return res.status(HttpStatus.OK).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const UpdateFarm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    if (
      !req.body.owner ||
      !req.body.name ||
      !req.body.phone ||
      !req.body._id ||
      !isObjectId(req.body.location.governorate) ||
      !isObjectId(req.body.location.center) ||
      !isObjectId(req.body.location.hamlet) ||
      !req.body.sampleNumber
    )
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS, updatedFarm: false });

    req.body._id = ObjectId(req.body._id);
    req.body.location.governorate = ObjectId(req.body.location.governorate);
    req.body.location.center = ObjectId(req.body.location.center);
    req.body.location.hamlet = ObjectId(req.body.location.hamlet);

    const farm = await FarmModel.findByIdAndUpdate(
      req.body._id,
      {
        name: req.body.name,
        phone: req.body.phone,
        owner: req.body.onwer,
        "location.governorate": req.body.location.governorate,
        "location.center": req.body.location.center,
        "location.hamlet": req.body.location.hamlet
      },
      { lean: true, new: true }
    );

    if (!farm) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, updatedFarm: false });
    }

    // TODO: Update all farms?
    const data = await RequestModel.findById(Id);

    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, updatedFarm: false });

    // Don't block
    DeletedModel.create({
      recordId: req.body._id,
      collectionName: "Farms",
      data: data.farm
    });

    await data.update({
      farm: {
        ...data.farm,
        ...farm
      },
      sampleNumber: req.body.sampleNumber
    });

    return res.status(HttpStatus.OK).json({ data: data, updatedFarm: true });
  } catch (error) {
    next(error);
  }
};
export const Delete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await RequestModel.findOneAndDelete(
      {
        _id: ObjectId(Id)
      },
      { lean: true }
    );
    if (!data) {
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    return res.status(200).json({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

/**
 * @function getMahaseelEngStats
 * @description Get Mahaseel Enginners Stats how many times they have been assigned
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 * @param {NextFunction} next Express Next Function
 */
export const getMahaseelEngStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fromDate = new Date(
      req.query.fromDate ? req.query.fromDate.toString() : -8640000000000000
    );
    const toDate = new Date(
      req.query.toDate ? req.query.toDate.toString() : 8640000000000000
    );
    const data = await RequestModel.aggregate(
      getMahaseelEngCount(fromDate, toDate)
    );
    return res.status(HttpStatus.OK).json({ data: data });
  } catch (err) {
    next(err);
  }
};

/**
 * @function EstimateRequest
 * @description Estimates the yield of request, calls other services to get the data
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 * @param {NextFunction} next Express Next Function
 */
export const EstimateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reqId = req.params.id;
    const gpxIndex = Number(req.params.gpxIndex);
    const age = req.query.cropAge;
    if (!isPositiveNumber(age))
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: ErrorMessage.INVALID_PARAMS,
        errorCode: ErrorMessage.INVALID_PARAMS
      });

    const request = await requestRepo.findById(reqId);
    if (!request)
      return res.status(HttpStatus.NOT_FOUND).json({
        message: ErrorMessage.NO_RESOURCE_FOUND,
        error: ErrorCode.NO_RESOURCE_FOUND
      });

    if (!(gpxIndex in request.gpx))
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: ErrorMessage.NO_GPX_POINTS,
        error: ErrorCode.NO_GPX_POINTS
      });

    if (request.gpx[gpxIndex].estimation) {
      return res
        .status(HttpStatus.OK)
        .json({ data: request.gpx[gpxIndex].estimation });
    }

    const crop = await CropModel.findById(request.crop).lean().exec();
    if (!crop)
      return res.status(HttpStatus.CONFLICT).json({
        message: ErrorMessage.NO_CROP_FOUND,
        error: ErrorCode.NO_CROP_FOUND
      });

    const varietyObj = crop.varieties.find(
      variety =>
        variety.name_ar.replace(" ", "_") == request.gpx[gpxIndex].variety
    );
    if (!varietyObj)
      return res.status(HttpStatus.NOT_FOUND).json({
        message: ErrorMessage.NO_VARIETY_FOUND,
        error: ErrorCode.NO_VARIETY_FOUND
      });
    if (!varietyObj.estimatable)
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: ErrorMessage.CROP_NOT_ESTIMATABLE,
        error: ErrorCode.CROP_NOT_ESTIMATABLE
      });

    const points = request.gpx.map(gpx =>
      gpx.points.map(point => [point.lng, point.lat])
    );

    const response = await yieldEstimate(
      points[gpxIndex],
      request._id.toString(),
      varietyObj.name_en,
      age
    );
    if (!response) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: "Yeild Estimation Service down"
      });
    }
    request.gpx[gpxIndex].estimation = response;
    request.gpx[gpxIndex].cropAge = age;

    await requestRepo.findByIdAndUpdate(request._id, {
      gpx: request.gpx
    });
    return res.status(HttpStatus.OK).json({
      data: response
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @function EstimateRequestArray
 * @description Estimates the yield of request, calls other services to get the data
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 * @param {NextFunction} next Express Next Function
 */
export const EstimateRequestArray = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reqId = req.params.id;
    const request = await requestRepo.findById(reqId);
    if (!request)
      return res.status(HttpStatus.NOT_FOUND).json({
        message: ErrorMessage.NO_RESOURCE_FOUND,
        error: ErrorCode.NO_RESOURCE_FOUND
      });

    const Responses = await Promise.allSettled(
      req.body.map(
        async ({
          index: gpxIndex,
          cropAge: age
        }: {
          index: number;
          cropAge: number;
        }) => {
          if (!(gpxIndex in request.gpx))
            throw new HttpError(
              ErrorMessage.INDEX_OUT_OF_BOUND,
              HttpStatus.BAD_REQUEST,
              {
                error: ErrorCode.INDEX_OUT_OF_BOUND,
                index: gpxIndex
              }
            );

          if (!isPositiveNumber(age))
            throw new HttpError(
              ErrorMessage.INVALID_AGE,
              HttpStatus.BAD_REQUEST,
              {
                error: ErrorCode.INVALID_AGE,
                piece: request.gpx[gpxIndex].name_ar
              }
            );

          if (request.gpx[gpxIndex].estimation) {
            // if estimation already exists, return it
            Promise.resolve(request.gpx[gpxIndex].estimation);
          }

          const crop = await CropModel.findById(request.crop).lean().exec();
          if (!crop)
            throw new HttpError(
              ErrorMessage.NO_CROP_FOUND,
              HttpStatus.CONFLICT,
              {
                error: ErrorCode.NO_CROP_FOUND,
                piece: request.gpx[gpxIndex].name_ar
              }
            );

          const varietyObj = crop.varieties.find(
            variety =>
              variety.name_ar.replace(" ", "_") == request.gpx[gpxIndex].variety
          );
          if (!varietyObj)
            throw new HttpError(
              ErrorMessage.NO_VARIETY_FOUND,
              HttpStatus.NOT_FOUND,
              {
                error: ErrorCode.NO_VARIETY_FOUND,
                piece: request.gpx[gpxIndex].name_ar
              }
            );
          if (!varietyObj.estimatable)
            throw new HttpError(
              ErrorMessage.CROP_NOT_ESTIMATABLE,
              HttpStatus.BAD_REQUEST,
              {
                error: ErrorCode.CROP_NOT_ESTIMATABLE,
                piece: request.gpx[gpxIndex].name_ar
              }
            );

          const points = request.gpx.map(gpx =>
            gpx.points.map(point => [point.lng, point.lat])
          );

          const response = await yieldEstimate(
            points[gpxIndex],
            request._id.toString(),
            varietyObj.name_en,
            age
          );
          if (!response) {
            throw new HttpError(
              "Yeild Estimation Service down",
              HttpStatus.SERVICE_UNAVAILABLE,
              {
                error: ErrorCode.YIELD_ESTIMATION_DOWN,
                piece: request.gpx[gpxIndex].name_ar
              }
            );
          }
          request.gpx[gpxIndex].estimation = response;
          request.gpx[gpxIndex].cropAge = age;

          await requestRepo.findByIdAndUpdate(request._id, {
            gpx: request.gpx
          });
          return response;
        }
      )
    );
    if (Responses.every(response => response.status === "rejected"))
      // All requests failed
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: "All estimations failed!",
        data: [],
        error: Responses.map(
          response => response.status === "rejected" && response.reason
        )
          .filter(Boolean) // remove undefined
          .map(mapErrorToResponse)
      });
    if (Responses.some(response => response.status === "rejected"))
      // The request succeeded, but some of the promises rejected
      return res.status(HttpStatus.OK).json({
        message: "Some estimations failed",
        data: Responses.map(
          response => response.status === "fulfilled" && response.value
        ).filter(Boolean),
        error: Responses.map(
          response => response.status === "rejected" && response.reason
        )
          .filter(Boolean) // remove undefined
          .map(mapErrorToResponse)
      });

    return res.status(HttpStatus.OK).json({
      message: "All estimations succeeded",
      data: Responses,
      error: []
    });
  } catch (err) {
    next(err);
  }
};

const filterQuery = (query: {
  status?: string;
  crop?: string;
  code?: string;
  governorate?: string;
  farmName?: string;
  farmPhone?: string;
  farmOwner?: string;
  carbonFootprint?: string;
  today?: boolean;
}) => {
  const filter: FilterQuery<RequestDocument> = {};

  if (query.status) {
    filter["status"] = { $eq: query.status };
  }

  if (query.governorate && isObjectId(query.governorate)) {
    filter["farm.location.governorate"] = {
      $eq: ObjectId(query.governorate)
    };
  }

  if (query.code && isCode(query.code) && isNumeric(query.code)) {
    filter["code"] = { $eq: query.code };
  }

  if (query.crop && isObjectId(query.crop)) {
    filter["crop"] = { $eq: ObjectId(query.crop) };
  }

  if (query.farmName) {
    filter["farm.name"] = { $regex: escapeString(query.farmName) };
  }

  if (query.farmOwner) {
    filter["farm.owner"] = { $regex: escapeString(query.farmOwner) };
  }

  if (query.farmPhone) {
    filter["farm.phone"] = { $regex: escapeString(query.farmPhone) };
  }

  if (query.carbonFootprint) {
    const str = escapeString(query.carbonFootprint);
    if (str.includes("A\\")) filter["gpx.carbonFootprint"] = "A+";
    else filter["gpx.carbonFootprint"] = str;
  }

  if (query.today) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter["createdAt"] = { $gte: today };
  }

  return filter;
};

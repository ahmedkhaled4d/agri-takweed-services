import { Request as RequestExpress, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { HttpStatus } from "../../../assets/httpCodes";
import { ObjectId } from "../../../helpers";
import { RequestModel } from "../../../models";
import { mapAggregation } from "../aggregations";

export const filterMap = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      // selectedCrops,
      selectedSeason
      // selectedGovernorate,
      // selectedCenter
    } = req.body;

    if (!req.body.selectedCrops || !selectedSeason) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "invalid body params , [selectedCrops , selectedSeason ] "
      });
    }
    const selectedCrops = req.body.selectedCrops.map((item: string) =>
      ObjectId(item)
    );

    const mapData = await RequestModel.aggregate(
      mapAggregation(filterSearch(req.body), selectedCrops, selectedSeason)
    );

    res.json(mapData);
  } catch (error) {
    next(error);
  }
};

const filterSearch = (body: {
  selectedGovernorate?: Array<string>;
  selectedCenter?: Array<string>;
}) => {
  const filter: Record<string, Record<string, string | unknown>> = {};

  if (body.selectedGovernorate) {
    // old map uses a single string, while new map uses an array of strings
    const selectedGovernorate: Array<Types.ObjectId> = Array.isArray(
      body.selectedGovernorate
    )
      ? body.selectedGovernorate.map(item => ObjectId(item))
      : [ObjectId(body.selectedGovernorate)];
    filter["farm.location.governorate"] = {
      $in: selectedGovernorate
    };
  }
  if (body.selectedCenter) {
    const selectedCenter = body.selectedCenter.map(item => ObjectId(item));
    filter["farm.location.center"] = { $in: selectedCenter };
  }

  return filter;
};

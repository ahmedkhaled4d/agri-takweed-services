import type { Request, Response, NextFunction } from "express";
import type { FilterQuery } from "mongoose";
import { HttpStatus } from "../../../assets/httpCodes";
import { CropModel, CropDocument } from "../../../models";
import { QualityModel } from "../../../models";

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await CropModel.find(filterQuery(req.query)).lean().exec();
    if (!data)
      return res.status(HttpStatus.NO_CONTENT).json({ message: "No content" });

    return res.status(HttpStatus.OK).json({ data, length: data.length });
  } catch (error) {
    return next(error);
  }
};

export const QualityController = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await QualityModel.find({ active: true }).select({
      name_ar: 1,
      name_en: 1
    });
    if (!data)
      return res.status(HttpStatus.NO_CONTENT).json({ message: "No content" });

    return res.status(HttpStatus.OK).json({ data, length: data.length });
  } catch (error) {
    return next(error);
  }
};

function filterQuery(query: Record<string, unknown>) {
  const filter: FilterQuery<CropDocument> = { active: true };

  if (query.all) {
    return {};
  }

  return filter;
}

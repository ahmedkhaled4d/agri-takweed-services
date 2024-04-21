import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { escapeString, isObjectId } from "../../../helpers";
import { CropModel } from "../../../models";
import { isPositiveNumber } from "../../../utils";
import { CropItemsAgg } from "../aggregations";

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 100;
    const skip = page * limit;
    limit = limit + skip;
    const data = await CropModel.aggregate(
      CropItemsAgg({
        filter: filterSearch(req.query),
        sortby: req.headers.sortby,
        sortvalue: parseInt(req.headers.sortvalue as string) || 1,
        limit,
        skip
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
    const Id = req.params.id;
    if (!isObjectId(Id))
      return res
        .status(400)
        .json({ message: ErrorMessage.INVALID_PARAMS, error: "invalid_id" });
    const data = await CropModel.findById(Id).lean().exec();
    if (!data) res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    return res.send({ data });
  } catch (error) {
    next(error);
  }
};

// Update DATA Details
export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const { name_ar, name_en, code, active, varieties } = req.body;
    const data = await CropModel.findByIdAndUpdate(
      Id,
      {
        name_ar,
        name_en,
        code,
        active,
        varieties
      },
      { new: true, lean: true }
    );
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res
      .status(200)
      .json({ data: { name_ar, name_en, code, active, varieties } });
  } catch (error) {
    next(error);
  }
};

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name_ar, name_en, code, varieties } = req.body;
    if (!name_ar || !name_en || !code) {
      return res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const crop = new CropModel({
      name_ar,
      name_en,
      code,
      varieties: varieties ?? []
    });
    const data = await crop.save();
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(200).json({ data });
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
    if (!Id)
      return res.status(400).json({ message: ErrorMessage.INVALID_PARAMS });
    const data = await CropModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(Id)
      },
      { lean: true }
    );
    if (!data) {
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    return res.status(200).send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

interface FilterType {
  name_ar?: string;
  name_en?: string;
  code?: string;
  active?: boolean;
}

// this function for filter data and search availablities
const filterSearch = (body: FilterType) => {
  const filter: Record<string, Record<string, string> | boolean> = {};

  if (!body) return filter;

  if (body.name_ar) {
    // handle nosql injections
    filter["name_ar"] = {
      $regex: escapeString(body.name_ar)
    };
  }
  if (body.name_en) {
    filter["name_en"] = { $regex: escapeString(body.name_en) };
  }
  if (body.code && isObjectId(body.code)) {
    filter["code"] = { $eq: body.code };
  }
  if (body.active) {
    filter["active"] = true;
  }
  return filter;
};

import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { LocationModel } from "../../../models";

export const Governorates = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await LocationModel.find({
      active: true,
      type: "governorate",
      parent: null
    })
      .select({
        _id: 1,
        name_ar: 1,
        name_en: 1,
        code: 1
        // 'coordinates' :1,
      })
      .lean()
      .exec();
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const Centers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const governorateid = req.params.governorateid;
    const data = await LocationModel.find({
      active: true,
      type: "center",
      parent: new mongoose.Types.ObjectId(governorateid)
    })
      .select({
        _id: 1,
        name_ar: 1,
        name_en: 1,
        code: 1
        // 'coordinates' :1,
      })
      .lean()
      .exec();
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const Hamlets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const centerid = req.params.centerid;
    const data = await LocationModel.find({
      active: true,
      type: "hamlet",
      parent: new mongoose.Types.ObjectId(centerid)
    })
      .select({
        _id: 1,
        name_ar: 1,
        name_en: 1,
        code: 1
        // 'coordinates' :1,
      })
      .lean()
      .exec();
    if (!data) {
      res.status(204).json({ message: "No content" });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

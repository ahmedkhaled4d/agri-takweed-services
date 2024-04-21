import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { FarmModel } from "../../../models";

export const List = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.user.userId;
    const data = await FarmModel.find({
      active: true,
      user: new mongoose.Types.ObjectId(userId)
    })
      .select({
        name: 1,
        color: 1
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

export const One = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmId = req.params.farmId;
    const data = await FarmModel.findById(farmId);
    if (!data) return res.status(204).json({ message: "No content" });

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.userId;
    const { name, owner, phone, location, color } = req.body;
    const newFarm = new FarmModel({
      user: userId,
      owner,
      phone,
      location,
      name,
      color
    });
    const data = await newFarm.save();
    if (!data) {
      return res
        .status(409)
        .json({ message: "Error Ocure while creating new farm" });
    }
    res.status(201).send({ data, message: "Farm is created Successfully" });
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
    const userId = res.locals.user.userId;
    const farmId = req.params.farmId;
    const data = await FarmModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(farmId),
        user: new mongoose.Types.ObjectId(userId)
      },
      { lean: true }
    );
    if (!data) {
      return res
        .status(409)
        .json({ message: "could not delete the farm,  resource not found" });
    }
    res.status(200).send({ message: "Farm is deleted Successfully" });
  } catch (error) {
    next(error);
  }
};

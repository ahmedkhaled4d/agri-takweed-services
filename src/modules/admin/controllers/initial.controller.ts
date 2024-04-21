import { InitialModel, FarmModel } from "../../../models";
import mongoose from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { NextFunction, Request, Response } from "express";
import { ListinitialAgg } from "../aggregations/initial.agg";
import { isPositiveNumber } from "../../../utils";

export const List = async (req: Request, res: Response) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;

    const data = await InitialModel.aggregate(
      ListinitialAgg({
        filter: filterSearch(req.query),
        sortby: req.headers.sortby as string,
        sortvalue: parseInt(req.headers.sortvalue as string) || 1,
        limit,
        skip
      })
    );
    if (!data) {
      res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    res.status(500).json(error);
  }
};

// One Details with full data
export const One = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Id = req.params.id;
    const data = await InitialModel.findById(Id)
      .populate("crop", `-varieties -createdAt -updatedAt`)
      // .populate('farm.location.governorate')
      .populate({
        path: "farm.location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "farm.location.center",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "farm.location.hamlet",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate("user", `-accessToken -password`);

    if (!data) res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    res.send({ data });
  } catch (error) {
    next(error);
  }
};

export const Update = async (req: Request, res: Response) => {
  try {
    const Id = req.params.id;
    const {
      farmName,
      ownerName,
      phoneNumber,
      crop,
      address,
      governorate,
      center,
      hamlet,
      varaities
    } = req.body;
    if (
      !farmName ||
      !ownerName ||
      !phoneNumber ||
      !crop ||
      !address ||
      !governorate ||
      !center ||
      !hamlet ||
      !varaities
    ) {
      res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const initialData = await InitialModel.findByIdAndUpdate(
      Id,
      {
        "farm.name": farmName,
        "farm.owner": ownerName,
        "farm.phone": phoneNumber,
        crop: crop,
        "farm.location.address.address": address,
        "farm.location.address.landmark": address,
        "farm.location.governorate": new mongoose.Types.ObjectId(governorate),
        "farm.location.center": new mongoose.Types.ObjectId(center),
        "farm.location.hamlet": new mongoose.Types.ObjectId(hamlet),
        varieties: varaities
      },
      { new: true, lean: true }
    );

    if (!initialData)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    await InitialModel.updateMany(
      { "farm._id": initialData.farm._id },
      {
        "farm.name": farmName,
        "farm.owner": ownerName,
        "farm.phone": phoneNumber,
        "farm.location.address.address": address,
        "farm.location.address.landmark": address,
        "farm.location.governorate": new mongoose.Types.ObjectId(governorate),
        "farm.location.center": new mongoose.Types.ObjectId(center),
        "farm.location.hamlet": new mongoose.Types.ObjectId(hamlet)
      },
      { new: true, lean: true }
    );

    const farmData = await FarmModel.findByIdAndUpdate(
      initialData.farm._id,
      {
        name: farmName,
        owner: ownerName,
        phone: phoneNumber,
        "location.address.address": address,
        "location.address.landmark": address,
        "location.governorate": governorate,
        "location.center": center,
        "location.hamlet": hamlet
      },
      { new: true, lean: true }
    );
    if (!farmData) {
      res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    res.status(200).json({ data: initialData });
  } catch (error) {
    res.status(500).json(error);
  }
};

// Delete Resource By ID
export const refuse = async (req: Request, res: Response) => {
  try {
    const data = await InitialModel.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    res.status(200).send({ message: "request Deleted" });
  } catch (error) {
    res.status(500).json(error);
  }
};

interface FilterType {
  code?: string;
  governorate?: string;
  crop?: string;
  farmName?: string;
  farmOwner?: string;
  farmPhone?: string;
  today?: boolean;
}

const filterSearch = (body: FilterType) => {
  const filter: Record<string, Record<string, string | Date | unknown>> = {};
  if (body.governorate) {
    filter["farm.location.governorate"] = {
      $eq: new mongoose.Types.ObjectId(body.governorate)
    };
  }
  if (body.code) {
    filter["code"] = { $eq: body.code };
  }
  if (body.crop) {
    filter["crop"] = { $eq: new mongoose.Types.ObjectId(body.crop) };
  }
  if (body.farmName) {
    filter["farm.name"] = { $regex: body.farmName };
  }
  if (body.farmOwner) {
    filter["farm.owner"] = { $regex: body.farmOwner };
  }
  if (body.farmPhone) {
    filter["farm.phone"] = { $regex: body.farmPhone };
  }
  if (body.today) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter["createdAt"] = { $gte: today };
  }

  return filter;
};

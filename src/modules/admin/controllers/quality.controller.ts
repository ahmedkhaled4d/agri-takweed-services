import { NextFunction, Request, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { QualityModel } from "../../../models";

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.headers.page
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
    // TODO: Move
    const aggregate: Array<PipelineStage> = [
      {
        $match: filterSearch(req.query)
      },
      {
        $sort: {
          [req.headers.sortby as string]: req.headers.sortvalue
            ? (parseInt(req.headers.sortvalue.toString()) as -1 | 1)
            : (1 as const)
        }
      },
      { $limit: limit },
      { $skip: skip }
    ];
    const data = await QualityModel.aggregate(aggregate);
    if (!data) {
      res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One = async (req: Request, res: Response) => {
  try {
    const Id = req.params.id;
    const data = await QualityModel.findById(Id);
    if (!data) res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    res.send({ data });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const Update = async (req: Request, res: Response) => {
  try {
    const Id = req.params.id;
    const { name_ar, name_en, active } = req.body;
    const data = await QualityModel.findByIdAndUpdate(
      Id,
      {
        name_ar,
        name_en,
        active
      },
      { new: true, lean: true }
    );
    if (!data)
      res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    res.status(200).json({ data: { name_ar, name_en, active } });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const Create = async (req: Request, res: Response) => {
  try {
    const { name_ar, name_en } = req.body;
    if (!name_ar || !name_en) {
      res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const quality = new QualityModel({
      name_ar,
      name_en,
      active: true
    });
    const data = await quality.save();
    if (!data)
      res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const Delete = async (req: Request, res: Response) => {
  try {
    const Id = req.params.id;
    const data = await QualityModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(Id)
      },
      { lean: true }
    );
    if (!data) {
      res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    res.status(200).send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    res.status(500).json(error);
  }
};

const filterSearch = (body: {
  name_ar?: string;
  name_en?: string;
  active?: boolean;
}) => {
  const filter: Record<string, Record<string, string> | boolean> = {};
  if (body.name_ar) {
    filter["name_ar"] = { $regex: body.name_ar };
  }
  if (body.name_en) {
    filter["name_en"] = { $regex: body.name_en };
  }

  if (body.active) {
    filter["active"] = true;
  }
  return filter;
};

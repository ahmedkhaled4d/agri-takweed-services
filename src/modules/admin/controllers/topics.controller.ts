import { NextFunction, Request, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { escapeString } from "../../../helpers";
import { TopicsModel } from "../../../models";
import { isPositiveNumber } from "../../../utils";

const ObjectId = mongoose.Types.ObjectId;

export const topicsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
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
    const data = await TopicsModel.aggregate(aggregate);
    if (!data) {
      return res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.send({ Results: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const createTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const topics = new TopicsModel({
      name,
      active: true
    });
    const data = await topics.save();
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

export const updateTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const { name } = req.body;
    const data = await TopicsModel.findByIdAndUpdate(
      Id,
      { name },
      { new: true, lean: true }
    );
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(200).json({ data: { Id, name } });
  } catch (error) {
    next(error);
  }
};

export const deleteTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await TopicsModel.findOneAndDelete(
      {
        _id: new ObjectId(Id)
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

export const activeTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await TopicsModel.findByIdAndUpdate(
      Id,
      { active: true },
      { new: true, lean: true }
    );
    res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
};

export const deactiveTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await TopicsModel.findByIdAndUpdate(
      Id,
      { active: false },
      { new: true, lean: true }
    );
    res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
};

const filterSearch = (body: { name?: string; tourId?: string }) => {
  const filter: Record<string, Record<string, string>> = {};
  if (!body) {
    return filter;
  }
  // if (body.tourId) {
  //     filter["tourId"] = { '$regex': body.tourId }
  // }
  if (body.name) {
    filter["name"] = { $regex: escapeString(body.name) };
  }
  return filter;
};

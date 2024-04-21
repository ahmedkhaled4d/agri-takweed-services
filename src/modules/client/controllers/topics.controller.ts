import { NextFunction, Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { TopicsModel } from "../../../models";
import { isPositiveNumber } from "../../../utils";

export const topicsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 100;
    const skip = page * limit;
    limit = limit + skip;
    const aggregate: Array<PipelineStage> = [
      {
        $match: { active: { $ne: false } }
      },
      {
        $sort: {
          // TODO: Clean this!
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
      return res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const topics = new TopicsModel({
      name,
      active: true
    });
    const data = await topics.save();
    if (!data)
      return res.status(404).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

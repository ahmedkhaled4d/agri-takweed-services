import { NextFunction, Request, Response } from "express";
import { PostsModel } from "../../../models";
import { ErrorMessage } from "../../../assets/errors";
import { mostCommonWord } from "../utills/commonWord";
import { longestWord } from "../utills/longestWord";
import mongoose, { PipelineStage } from "mongoose";
import { isPositiveNumber } from "../../../utils";
import { escapeString } from "../../../helpers";

const ObjectId = mongoose.Types.ObjectId;

export const postsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 12;
    const skip = page * limit;
    limit = limit + skip;
    const aggregate: Array<PipelineStage> = [
      {
        $match: filterSearch(req.query)
      },
      {
        $lookup: {
          from: "topics",
          localField: "topicId",
          foreignField: "_id",
          as: "topic"
        }
      },
      {
        $match: { "topic.active": true }
      },
      { $unwind: "$topic" },
      { $unset: "topicId" },
      { $unset: "content" },
      {
        $sort: {
          updatedAt: -1
        }
      },
      { $limit: limit },
      { $skip: skip }
    ];

    const data = await PostsModel.aggregate(aggregate);

    if (!data) {
      return res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ Results: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // WARN: Not Used
    const { title, content /* topicId, image */ } = req.body;
    if (!req.body.topicId) req.body.topicId = req.params.topi;

    if (!title || !content) {
      return res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }

    const data = await PostsModel.create(req.body);
    console.log(data);
    if (!data)
      return res.status(404).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    res.status(201).json({ data });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

export const findPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = req.params.id;
    const { title, content, image } = req.body;
    const data = await PostsModel.findOneAndUpdate(
      { _id, active: true },
      {
        $inc: { views: 1 },
        title,
        content,
        image
      },
      { new: true }
    ).populate("topicId");
    if (!data)
      return res.status(204).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    const limitRelatedPost = 3;
    const related = await PostsModel.find({
      topicId: data.topicId,
      active: true
    })
      .select("-content")
      .limit(limitRelatedPost);

    let onlyString;
    // TODO: Changed this from 1 to "1"
    if (req.headers?.html?.toString() === "1") {
      onlyString = data.content.replace(/<([^>]+)>/gi, "").trim();
      data.content = onlyString;
    }

    const common = mostCommonWord(data.content);
    const long = longestWord(data.title);

    const tags = [...long, ...common];
    res.status(200).json({ data, related, tags });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

const filterSearch = (body: { topicId?: string; search?: string }) => {
  const filter: Record<string, unknown> = {};
  if (!body) {
    return filter;
  }

  if (body.topicId) {
    filter["topicId"] = { $eq: new ObjectId(body.topicId) };
  }

  if (body.search) {
    filter["$and"] = [
      {
        $or: [
          { title: { $regex: escapeString(body.search) } },
          { content: { $regex: escapeString(body.search) } }
        ]
      }
    ];
  }
  return filter;
};

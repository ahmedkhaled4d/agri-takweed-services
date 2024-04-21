import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { PostsModel } from "../../../models";
import { PostsListAgg } from "../aggregations";

export const postsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.headers.page
      ? Math.abs(parseInt(req.headers.page.toString()) - 1)
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
    const data = await PostsModel.aggregate(
      PostsListAgg({
        filter: filterSearch(req.query),
        skip,
        limit,
        sortby: req.headers.sortby as string,
        sortvalue: parseInt(req.headers.sortvalue as string) || 1
      })
    );

    if (!data) {
      return res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.send({ Results: data.length, data });
  } catch (error) {
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
    const data = await PostsModel.findOneAndUpdate(
      { _id, active: true },
      {
        $inc: { views: 1 }
      },
      { new: true, lean: true }
    );
    if (!data)
      return res.status(204).json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    return res.status(200).json({ data });
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
    const { title, content, topicId, image } = req.body;
    if (!title || !content) {
      return res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const posts = new PostsModel({
      title,
      content,
      topicId,
      image,
      active: true
    });
    const data = await posts.save();
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const { title, content, image, topicId } = req.body;
    const data = await PostsModel.findByIdAndUpdate(
      Id,
      {
        title,
        content,
        image,
        topicId
      },
      { new: true, lean: true }
    );
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;

    const data = await PostsModel.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(Id)
    });
    if (!data) return res.status(404).json({ message: "couldnt find post " });

    const imgName = data.image.substr(data.image.lastIndexOf("/") + 1);
    await PostsModel.deleteOne({ image: imgName }).lean();

    // Should check if data is found then delete image????
    if (!data) {
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    return res.status(200).send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

export const activePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await PostsModel.findByIdAndUpdate(
      Id,
      { active: true },
      { new: true, lean: true }
    );
    return res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
};

export const deactivePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await PostsModel.findByIdAndUpdate(
      Id,
      { active: false },
      { new: true, lean: true }
    );
    return res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
};

const filterSearch = (body: {
  title?: string;
  content?: string;
  topicId?: string;
}) => {
  const filter: Record<string, Record<string, string | unknown>> = {};
  if (!body) {
    return filter;
  }

  if (body.title) {
    filter["title"] = { $regex: body.title };
  }
  if (body.content) {
    filter["content"] = { $regex: body.content };
  }
  if (body.topicId) {
    filter["topicId"] = { $eq: new mongoose.Types.ObjectId(body.topicId) };
  }

  return filter;
};

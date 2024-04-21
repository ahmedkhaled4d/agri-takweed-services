import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { MessageModel } from "../../../models";
import { isPositiveNumber } from "../../../utils";
import { MessageListAgg } from "../aggregation";
const ObjectId = mongoose.Types.ObjectId;

export const List = async (req: Request, res: Response, next: NextFunction) => {
  const userId = res.locals.user.userId;
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = isPositiveNumber(req.headers.limit)
      ? parseInt(req.headers.limit.toString())
      : 5;
    const skip = page * limit;
    limit = limit + skip;
    const filter = {
      user: new ObjectId(userId)
    };
    const data = await MessageModel.aggregate(
      MessageListAgg(filter, limit, skip)
    );
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

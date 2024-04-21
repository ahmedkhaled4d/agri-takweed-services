import { Request, Response, NextFunction } from "express";
import { ErrorMessage } from "../../../assets/errors";
import { NewsLetterModel } from "../../../models";
import { subscriberList } from "../aggregations/newsletter.agg";

export const subscribersList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.headers.page
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
    const data = await NewsLetterModel.aggregate(
      subscriberList({
        sortby: req.headers.sortby as string,
        sortvalue: parseInt(req.headers.sortvalue as string) || 1,
        limit,
        skip
      })
    );
    if (!data) {
      return res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ Results: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const createSubscriber = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const newsLetter = new NewsLetterModel({
      email,
      active: true
    });
    const data = await newsLetter.save();
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

export const Active = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await NewsLetterModel.findByIdAndUpdate(
      Id,
      { active: true },
      { new: true, lean: true }
    );
    return res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
};

export const Deactive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await NewsLetterModel.findByIdAndUpdate(
      Id,
      { active: false },
      { new: true, lean: true }
    );
    return res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
};

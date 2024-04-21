import { NextFunction, Request, Response } from "express";
import { PageModel } from "../../../models";

export const PageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const name = req.params.name;
    const data = await PageModel.findOne({ title: name, active: true })
      .lean()
      .exec();
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    return res.send({ data });
  } catch (error) {
    next(error);
  }
};

export const addContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { title, text } = req.body;
    const data = await PageModel.findByIdAndUpdate(
      id,
      { $push: { content: { title, text } } },
      { safe: true, upsert: true, new: true, lean: true }
    );
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    return res.send({ data });
  } catch (error) {
    next(error);
  }
};

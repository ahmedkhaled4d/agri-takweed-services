import { RequestModel } from "../../../models";
import { NextFunction, Request, Response } from "express";
import { searchRequestsAgg } from "../aggregation/request.agg";
import { isPositiveNumber } from "../../../utils";

exports.List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = req.headers.limit ? parseInt(req.headers.limit.toString()) : 5;
    const skip = page * limit;
    limit = limit + skip;
    const filter = {
      code: req.params.code,
      status: "accept",
      cancelled: { $ne: true }
    };
    const data = await RequestModel.aggregate(
      searchRequestsAgg({ filter, skip, limit })
    );
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One = async (req: Request, res: Response, next: NextFunction) => {
  const code = req.params.code;
  try {
    const data = await RequestModel.findOne(
      { code, cancelled: false, status: "accept" },
      "code"
    )
      .populate({
        path: "crop",
        model: "crop",
        select: { name_ar: 1, code: 1 }
      })
      .populate({
        path: "farm.location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      });

    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

import { LoanModel, ServiceModel } from "../../../models";
import { ErrorMessage } from "../../../assets/errors";
import { NextFunction, Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { isPositiveNumber } from "../../../utils";
import { escapeString } from "../../../helpers";

export const getservices = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await ServiceModel.find({});
    res.json({ services: services });
  } catch (err) {
    next(err);
  }
};

export const addService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const service = new ServiceModel({
      name_en: req.body.name_en,
      name_ar: req.body.name_ar,
      type: req.body.type
    });
    service.save();
    res.status(201).send({ message: "Done" });
  } catch (err) {
    next(err);
  }
};

export const acceptLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await LoanModel.findByIdAndUpdate(
      req.params.id,
      { status: "accept" },
      { lean: true }
    );
    res.status(201).send({ message: "Done" });
  } catch (err) {
    next(err);
  }
};

export const refuseLoan = async (req: Request, res: Response) => {
  await LoanModel.findByIdAndUpdate(
    req.params.id,
    { status: "reject" },
    { lean: true }
  );
  res.status(201).send({ message: "Done" });
};

export const One = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const loan = await LoanModel.findById(id).lean();
    res.status(200).json({ loan: loan });
  } catch (err) {
    next(err);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
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
        $project: {
          name: 1,
          code: 1,
          NoOfRequests: 1,
          status: 1,
          cancelled: 1,
          createdAt: 1,
          phone: 1
        }
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

    const data = await LoanModel.aggregate(aggregate);
    if (!data) {
      res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

const filterSearch = (body: {
  name?: string;
  code?: string;
  phone?: string;
  today?: boolean;
}) => {
  const filter: Record<string, Record<string, string | Date>> = {};
  if (body.name) {
    filter["name"] = { $eq: body.name };
  }
  if (body.code) {
    filter["code"] = { $eq: body.code };
  }
  if (body.phone) {
    filter["phone"] = { $regex: escapeString(body.phone) };
  }
  if (body.today) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter["createdAt"] = { $gte: today };
  }

  return filter;
};

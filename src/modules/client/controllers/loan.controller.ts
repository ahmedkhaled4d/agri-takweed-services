import { NextFunction, Request, Response } from "express";
import { MongoClient } from "mongodb";
import { PipelineStage } from "mongoose";
import { HttpStatus } from "../../../assets/httpCodes";
import { ObjectId } from "../../../helpers";
import {
  LoanModel,
  RequestModel,
  ServiceModel,
  UserModel
} from "../../../models";

export const addLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.userId;
    const loanValue = req.body.loanValue;
    const serviceNames = req.body.serviceNames;
    const serviceId = req.body.serviceId;
    const userData = await UserModel.findOne({ _id: ObjectId(userId) });
    if (!userData)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    const name = userData.name;
    const email = userData.email;
    const phone = userData.phone;
    const cancelled = false;
    const status = "inprogress";
    const agg: Array<PipelineStage> = [
      {
        $match: {
          user: ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          count: {
            $count: {}
          }
        }
      }
    ];
    const NoOfRequests = await RequestModel.aggregate(agg);
    const loan = new LoanModel({
      name: name,
      code: await genCode(),
      loanValue: loanValue,
      email: email,
      user: ObjectId(userId),
      phone: phone,
      cancelled: cancelled,
      status: status,
      serviceNames: serviceNames,
      serviceId: serviceId,
      NoOfRequests: NoOfRequests[0].count
    });
    loan.save();
    return res.status(201).send({ message: "Done" });
  } catch (err) {
    next(err);
  }
};

export const getLoan = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user.userId;
    const loans = await LoanModel.find({ user: ObjectId(user) });
    res.json({ loans: loans });
  } catch (err) {
    next(err);
  }
};

export const cancelLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await LoanModel.findByIdAndUpdate(req.params.id, { cancelled: true });
    res.json({ message: "Loan Cancelled" });
  } catch (err) {
    next(err);
  }
};

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

const genCode = async () => {
  const today = new Date();
  const year = today.toISOString().substring(2, 4);
  const month = today.toISOString().substring(5, 7);
  const day = today.toISOString().substring(8, 10);
  const client = await MongoClient.connect(process.env.MONGO_DB ?? "");

  const db = client.db(process.env.DB_NAME ?? "test");
  try {
    const res = await db.collection("loans").findOne(
      {
        $and: [
          { $expr: { $eq: [{ $year: "$createdAt" }, parseInt(year)] } },
          { $expr: { $eq: [{ $month: "$createdAt" }, parseInt(month)] } },
          { $expr: { $eq: [{ $dayOfMonth: "$createdAt" }, parseInt(day)] } }
        ]
      },
      { sort: { createdAt: -1 } }
    );
    console.log(res);
    if (res === null) {
      const codeStr = year + "" + month + "" + day + "" + "0001";
      return codeStr;
    } else {
      let gotCode = parseInt(res.code);
      gotCode += 1;
      return gotCode;
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
};

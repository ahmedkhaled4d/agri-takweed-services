import { FilterQuery } from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { ObjectId } from "../../../helpers";
import { CommitteeDoc, CommitteeModel } from "../../../models";
import DeletedModel from "../../../models/shared/deleted.model";
import { ExpressFunc } from "../../../types";
import { getFormattedDate } from "../../../utils";
import { getCommitteeUsersCountAgg } from "../aggregations";
import { committeeSendNotification } from "../helpers";

export const List: ExpressFunc = async (req, res, next) => {
  try {
    const data = await CommitteeModel.find(filterQuery(req.query))
      .skip(req.skip)
      .limit(req.limit)
      .populate("mahaseelUser", "name _id")
      .populate("hagrUser", "name _id")
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return res.status(HttpStatus.OK).json({ data: data, length: data.length });
  } catch (err) {
    return next(err);
  }
};

export const One: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params._id)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.MISSING_PARAM });
    const data = await CommitteeModel.findOne(req.params)
      .populate("mahaseelUser", "name _id")
      .populate("hagrUser", "name _id")
      .lean()
      .exec();
    if (data) return res.status(HttpStatus.OK).json({ data: data });
    return res
      .status(HttpStatus.NOT_FOUND)
      .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
  } catch (err) {
    return next(err);
  }
};

export const Update: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params._id)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.MISSING_PARAM });
    const data = await CommitteeModel.findOneAndUpdate(req.params, req.body, {
      new: true
    });
    if (data) return res.status(HttpStatus.OK).json({ data: data });
    return res
      .status(HttpStatus.NOT_FOUND)
      .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
  } catch (err) {
    next(err);
  }
};

export const Delete: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params._id)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.MISSING_PARAM });
    const data = await CommitteeModel.findById(req.params);
    DeletedModel.create({
      recordId: req.params._id,
      collectionName: "committees",
      data: data
    });
    await data?.delete();
    if (data) {
      let sentNotification = true;
      const message = `🔔 ${data.comitteeCode} الغاء لجنة رقم `;
      const result = await committeeSendNotification(
        ObjectId(data.mahaseelUser),
        ObjectId(data.hagrUser),
        message
      );
      // errors are logged by the fcm service
      if (result.err) {
        if (result.reason.message === ErrorMessage.NO_USER_FOUND_IN_DB)
          // if the user is not found in the db, we need to stop the request
          // and log the error
          // and return the error to the client
          return next(result.reason);
        sentNotification = false;
      }
      return res
        .status(HttpStatus.OK)
        .json({ message: ErrorMessage.SUCCESS_ACTION, sentNotification });
    }
    return res
      .status(HttpStatus.NOT_FOUND)
      .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
  } catch (err) {
    next(err);
  }
};

export const Create: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.body || !req.body.hagrUser || !req.body.mahaseelUser)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });
    const data = new CommitteeModel(req.body);
    await data.save();

    let sentNotification = true;
    const message = `🔔 ${getFormattedDate(data.committeeDate)} لجنة يوم`;
    const result = await committeeSendNotification(
      ObjectId(data.mahaseelUser),
      ObjectId(data.hagrUser),
      message
    );
    if (result.err) {
      console.error(result.reason);
      if (result.reason.message === ErrorMessage.NO_USER_FOUND_IN_DB)
        return next(result.reason);
      sentNotification = false;
    }
    if (data)
      return res.status(HttpStatus.OK).json({ data: data, sentNotification });
  } catch (err) {
    next(err);
  }
};

export const getCommitteeUsersNum: ExpressFunc = async (req, res, next) => {
  try {
    const fromDate = new Date(
      req.query.fromDate ? req.query.fromDate.toString() : -8640000000000000
    );
    const toDate = new Date(
      req.query.toDate ? req.query.toDate.toString() : 8640000000000000
    );
    const data = await CommitteeModel.aggregate(
      getCommitteeUsersCountAgg(toDate, fromDate)
    );
    res.status(HttpStatus.OK).json({ data: data });
  } catch (e) {
    next(e);
  }
};

function filterQuery(query: Record<string, unknown>) {
  const filter: FilterQuery<CommitteeDoc> = {};

  if (query.committeeDate)
    filter["committeeDate"] = { $gte: query.committeeDate };

  if (query.code) filter["comitteeCode"] = { $eq: query.code };

  if (query.reqCode) filter["farms.code"] = { $eq: query.reqCode };

  if (query.status) filter["status"] = { $eq: query.status };

  if (query.eng)
    filter["$or"] = [
      { mahaseelUser: { $eq: query.eng } },
      { hagrUser: { $eq: query.eng } }
    ];

  if (query.today) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter["createdAt"] = { $gte: today };
  }
  return filter;
}

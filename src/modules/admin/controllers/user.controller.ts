import { NextFunction, Request as RequestExpress, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { escapeString } from "../../../helpers";
import {
  FarmModel,
  MessageModel,
  RequestModel,
  UserModel,
  Permission,
  Permissions
} from "../../../models";
import { UserDocument } from "../../../models";
import { isPositiveNumber } from "../../../utils";
import { sendByToken } from "../services/fcm.service";

const ObjectId = mongoose.Types.ObjectId;

export const List = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
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
          email: 1,
          phone: 1,
          permissions: 1,
          nationalId: 1,
          tradeId: 1,
          otpVerified: 1,
          role: 1,
          createdAt: 1
        }
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
    const data = await UserModel.aggregate(aggregate);
    if (!data) {
      res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await UserModel.findById(Id).select({
      accessToken: 0,
      password: 0,
      fcm: 0
    });
    const messages = await MessageModel.find({ user: new ObjectId(Id) })
      .select({
        user: 0
      })
      .sort({ createdAt: -1 })
      .limit(10);
    const requests = await RequestModel.find({ user: new ObjectId(Id) })
      .select({
        user: 0,
        location: 0,
        varieties: 0,
        quality: 0
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const farms = await FarmModel.find({ user: new ObjectId(Id) });
    if (!data) res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    res.send({ data, messages, requests, farms });
  } catch (error) {
    next(error);
  }
};

/**
 * Update DATA Details
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const Update = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const { email, name, nationalId, tradeId } = req.body;
    const data = await UserModel.findByIdAndUpdate(
      Id,
      {
        email,
        name,
        nationalId,
        tradeId
      },
      { new: true }
    )
      .select({
        accessToken: 0,
        password: 0,
        fcm: 0
      })
      .lean();
    if (!data)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(200).json({ data: { email, name, nationalId, tradeId } });
  } catch (error) {
    next(error);
  }
};

/**
 * send messgae to one user
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const SendMessage = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(409).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const user: UserDocument | null = await UserModel.findById(id);
    if (user) {
      const message = new MessageModel({
        user: user._id,
        ...req.body
      });
      const data = await message.save();
      if (!data)
        return res
          .status(409)
          .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
      // send notification here FCM
      if (user?.fcm) {
        sendByToken(user.fcm, title, {
          key: "screen",
          value: "inbox"
        });
      } else
        return res
          .status(400)
          .json({ message: "FCM Token does not exist for user." });
      // use user.fcm var
      return res.status(200).json({ data });
    }
    return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
  } catch (error) {
    next(error);
  }
};

export const Delete = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await UserModel.findOneAndDelete(
      {
        _id: new ObjectId(Id)
      },
      { lean: true }
    );
    if (!data) {
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    return res.status(200).send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

const filterSearch = (body: {
  email?: string;
  name?: string;
  nationalId?: string;
  tradeId?: string;
  phone?: string;
  otpVerified?: "0" | "1";
}) => {
  const filter: Record<string, unknown> = {
    role: {
      $ne: "admin"
    }
  };

  if (!body) {
    return filter;
  }

  if (body.email) {
    filter["email"] = { $regex: escapeString(body.email) };
  }
  if (body.name) {
    filter["name"] = { $regex: escapeString(body.name) };
  }
  if (body.nationalId) {
    filter["nationalId"] = { $eq: body.nationalId };
  }
  if (body.tradeId) {
    filter["tradeId"] = { $eq: body.tradeId };
  }
  if (body.phone) {
    filter["phone"] = { $eq: "+2" + body.phone };
  }
  if (body.otpVerified === "1") {
    filter["otpVerified"] = true;
  }
  if (body.otpVerified === "0") {
    filter["otpVerified"] = false;
  }
  return filter;
};

export const NotifyGroup = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, crop, governorate } = req.body;
    if (!message || !crop || !governorate) {
      res.status(409).json({ message: "invalid body params" });
    }
    if (crop == "global" || governorate == "global") {
      // send to topic global
      sendByToken(`/topics/global`, "🔔" + message, {
        key: "screen",
        value: "inbox"
      });
      res.json({ message: "sent to all users" });
    } else {
      sendByToken(`/topics/${crop}`, message, {
        key: "screen",
        value: "inbox"
      });
      sendByToken(`/topics/${governorate}`, message, {
        key: "screen",
        value: "inbox"
      });
      res.json({ message: "sent to spesific topics", crop, governorate });
    }
  } catch (e) {
    next(e);
  }
};

export const activeOTP = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await UserModel.findByIdAndUpdate(
      Id,
      { otpVerified: true },
      { new: true, lean: true }
    );
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const DeactiveOTP = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await UserModel.findByIdAndUpdate(
      Id,
      { otpVerified: false },
      { new: true, lean: true }
    );
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const activeReviewer = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await UserModel.findByIdAndUpdate(
      Id,
      { reviewer: true },
      { new: true, lean: true }
    );
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const DeactiveReviwer = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    const data = await UserModel.findByIdAndUpdate(
      Id,
      { reviewer: false },
      { new: true, lean: true }
    );
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const ModifyPermissions = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.permissions || !req.params.userId) {
      return res.status(400).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const permissions = req.body.permissions as Permissions;
    const user = await UserModel.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    // This is terrible!
    // TODO: Clean this!
    permissions.map(perm => {
      user.permissions.some((userPerm: Permission, index: number) => {
        if (userPerm.key === perm.key) return (userPerm.value = perm.value);
        if (user.permissions.length === index + 1)
          return user.permissions.push(perm);
      });
    });
    user.markModified("permissions");
    await user.save();
    return res.status(200).json({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (err) {
    next(err);
  }
};

export const getPermissions = async (
  req: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.userId) {
      return res.status(400).json({ message: ErrorMessage.INVALID_PARAMS });
    }
    const user = await UserModel.findById(req.params.userId)
      .select({
        permissions: 1
      })
      .lean()
      .exec();
    if (!user)
      return res.status(404).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const getEngineers = async (
  _: RequestExpress,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await UserModel.find({ role: "engineer" })
      .select({
        _id: 1,
        name: 1,
        phone: 1
      })
      .lean();
    if (data) return res.status(200).json({ data: data });
    return res.status(404).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
  } catch (err) {
    next(err);
  }
};

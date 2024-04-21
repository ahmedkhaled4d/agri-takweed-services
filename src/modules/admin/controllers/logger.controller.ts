import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { escapeString } from "../../../helpers";
import { UserModel } from "../../../models";
import * as LoggerRepo from "../../../repositories/logger.repository";
import { ExpressCustomFunc, ExpressFunc } from "../../../types";
import { isPositiveNumber } from "../../../utils";
import { HttpError } from "../../../utils/error";

export const List: ExpressCustomFunc = async (req, res, next) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    const limit = 20;
    const skip = page * limit;
    const data = await LoggerRepo.find(
      filterQuery(req.query as Record<string, string>),
      limit,
      skip
    );
    return res.status(HttpStatus.OK).json({ data: data, length: data.length });
  } catch (err) {
    next(err);
  }
};

export const One: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params._id)
      throw new HttpError(ErrorMessage.INVALID_PARAMS, HttpStatus.BAD_REQUEST);
    const data = await LoggerRepo.findById(req.params._id);
    if (data) return res.status(HttpStatus.OK).json({ data: data });
    throw new HttpError(ErrorMessage.NO_RESOURCE_FOUND, HttpStatus.NOT_FOUND);
  } catch (err) {
    next(err);
  }
};

export const Delete: ExpressFunc = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({
      _id: res.locals.user.userId
    }).lean();
    if (!user)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Cant find user!" });
    user.permissions.some(perm => {
      if (perm.key === "CanDeleteLogs")
        if (perm.value) return;
        else
          throw new HttpError(
            "You don't have permission to delete Logs!",
            HttpStatus.FORBIDDEN
          );
    });
    if (req.params._id) {
      await LoggerRepo.deleteOne(req.params._id);
      return res
        .status(HttpStatus.OK)
        .json({ message: ErrorMessage.SUCCESS_ACTION });
    }
    const num = Number(req.query?.number?.toString() ?? 200);
    await LoggerRepo.deleteManyByNumber(num);
    return res
      .status(HttpStatus.OK)
      .json({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (err) {
    next(err);
  }
};

const filterQuery = (body: Record<string, string>) => {
  const fromDate = new Date(body?.fromDate?.toString() ?? -8640000000000000);
  const toDate = new Date(body?.toDate?.toString() ?? 8640000000000000);

  const filter: Record<string, unknown> = {
    createdAt: {
      $lt: toDate,
      $gte: fromDate
    }
  };

  if (body.type) filter["type"] = { $eq: body.type };
  if (body.action) filter["action"] = { $eq: body.action };
  if (body.resource)
    filter["resource"] = { $regex: escapeString(body.resource) };
  if (body.ip) filter["ip"] = { $eq: body.ip };
  if (body.userAgent) filter["userAgent"] = { $eq: body.userAgent };
  if (body.user) filter["userId"] = { $eq: body.userId };
  return filter;
};

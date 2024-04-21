/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { FilterQuery, QueryOptions } from "mongoose";
import { LoggerDocument, LoggerModel, Logger } from "../../models";

export const findOne = (
  query: FilterQuery<LoggerDocument>,
  options: QueryOptions<LoggerDocument> = {}
) =>
  LoggerModel.findOne(query, options).populate("userId", "name phone").lean();

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export const Create = (_log: Logger) => "void";

export const find = (
  query: FilterQuery<LoggerDocument>,
  limit = 10,
  skip = 0,
  options: QueryOptions<LoggerDocument> | undefined = {}
) =>
  LoggerModel.find(query, options)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 })
    .populate("userId", "name phone")
    .lean()
    .exec();

// Do nothing
export const deleteOne = (_id: string) => {
  return "Deletedddd";
};

// Do nothing
export const deleteManyByNumber = async (num: number) => {
  const ids = await LoggerModel.find({}, { _id: 1 })
    .sort({ createdAt: 1 })
    .limit(num)
    .select("_id")
    .lean()
    .exec();
  if (ids) return "Deleted Many!";
};

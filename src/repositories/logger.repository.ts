import { FilterQuery, QueryOptions } from "mongoose";
import { LoggerDocument, LoggerModel, Logger } from "../models";

export const findOne = (
  query: FilterQuery<LoggerDocument>,
  options: QueryOptions<LoggerDocument> | undefined = {}
) =>
  LoggerModel.findOne(query, options).populate("userId", "name phone").lean();

export const findById = (
  id: string,
  options: QueryOptions<LoggerDocument> | undefined = {}
) => LoggerModel.findById(id, options).populate("userId", "name phone").lean();

export const Create = (log: Logger) => LoggerModel.create(log);

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

export const deleteOne = (id: string) =>
  LoggerModel.findOneAndDelete({ _id: id });

export const deleteManyByNumber = async (num: number) => {
  const ids = await LoggerModel.find({}, { _id: 1 })
    .sort({ createdAt: 1 })
    .limit(num)
    .select("_id")
    .lean()
    .exec();
  if (ids) return LoggerModel.deleteMany({ _id: { $in: ids } });
};

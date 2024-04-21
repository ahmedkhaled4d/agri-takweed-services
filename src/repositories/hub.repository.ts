import type {
  FilterQuery,
  ProjectionType,
  QueryOptions,
  UpdateQuery
} from "mongoose";
import { HubDocument, HubModel, Hub } from "../models";
import DeletedModel from "../models/shared/deleted.model";

export const hubRepo = {
  findOne: (
    query: FilterQuery<HubDocument>,
    options: QueryOptions<HubDocument> = { lean: true },
    select: ProjectionType<HubDocument> = {}
  ) => HubModel.findOne(query, select, options).exec(),

  findById: (
    id: string,
    options: QueryOptions<HubDocument> = { lean: true },
    select: ProjectionType<HubDocument> = {}
  ) =>
    HubModel.findById(id, select, options)
      .populate({
        path: "location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "location.center",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "location.hamlet",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .exec(),

  findByIdAndUpdate: (
    id: string,
    update: UpdateQuery<HubDocument>,
    options: QueryOptions<HubDocument> = { lean: true }
  ) => HubModel.findByIdAndUpdate(id, update, options),

  Create: (item: Hub) => HubModel.create(item),

  find: (
    query: FilterQuery<HubDocument>,
    limit = 10,
    skip = 0,
    options: QueryOptions<HubDocument> = { lean: true },
    select: ProjectionType<HubDocument> = {
      hubName: 1,
      hubCode: 1,
      hubId: 1,
      type: 1,
      subType: 1
    }
  ) =>
    HubModel.find(query, select, options)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .exec(),

  deleteOne: async (id: string) => {
    const data = await HubModel.findOneAndDelete({ _id: id });
    if (data)
      DeletedModel.create({
        recordId: data._id,
        collectionName: "hub",
        data: data,
        type: "delete"
      });
    return data;
  },

  getHubsNameOnly: (
    query: FilterQuery<HubDocument>,
    options: QueryOptions<HubDocument> = { lean: true }
  ) =>
    HubModel.find(query, { _id: 1, hubName: 1 }, options)
      .sort({ createdAt: -1 })
      .exec()
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  FilterQuery,
  LeanDocument,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery
} from "mongoose";
import type {
  HubDocument,
  RequestTraceability,
  RequestTraceabilityDocument
} from "../models";
import { RequestTraceabilityModel } from "../models";
import {
  RequestTraceabilityOneReportForTreeAgg,
  getRequestTraceByCodeAgg
} from "../modules/admin/aggregations";
import {
  HistoryDataForPdf,
  getHistoryUsingCodeAndIdForPdfAgg
} from "../modules/admin/aggregations/pdf/trace.history.cert.agg";
import { requestTraceabilityGeneral } from "../modules/admin/aggregations/reports/requestTraceability_general.agg";
import { requestTraceabilityRepo } from "../modules/admin/services/domain/traceability.service";
import { hubRepo } from "./hub.repository";

interface FilterType {
  code?: string;
  crop?: string;
}

const reqTraceRepo: requestTraceabilityRepo = {
  findOne: (
    query: FilterQuery<RequestTraceabilityDocument> = {},
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true },
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) => RequestTraceabilityModel.findOne(query, select, options).exec(),

  findById: (
    id: string,
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true },
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) => RequestTraceabilityModel.findById(id, select, options).exec(),

  findByCode: (
    code: string,
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true },
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) => RequestTraceabilityModel.findOne({ code: code }, select, options).exec(),

  Create: (item: RequestTraceability) => RequestTraceabilityModel.create(item),

  findByIdAndUpdate: (
    id: string,
    update: UpdateQuery<RequestTraceabilityDocument>,
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true }
  ) => RequestTraceabilityModel.findByIdAndUpdate(id, update, options),

  find: (
    query: FilterQuery<RequestTraceabilityDocument>,
    options: QueryOptions<RequestTraceabilityDocument> = {},
    select: ProjectionType<RequestTraceabilityDocument> = {
      _id: 1,
      code: 1
    }
  ) =>
    RequestTraceabilityModel.find(query, select, options)
      .lean()
      .sort({ createdAt: -1 })
      .exec(),

  findPaginated: (
    query: FilterQuery<RequestTraceabilityDocument>,
    limit = 10,
    skip = 0,
    options: QueryOptions<RequestTraceabilityDocument> = {},
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) =>
    RequestTraceabilityModel.find(query, select, options)
      .limit(limit)
      .skip(skip)
      .lean()
      .sort({ createdAt: -1 })
      .exec(),

  deleteOneById: (id: string) => RequestTraceabilityModel.findByIdAndDelete(id),

  filterSearch: (body: FilterType) => {
    const filter: FilterQuery<RequestTraceabilityDocument> = {};

    if (!body) return filter;

    if (body.code) filter["code"] = { $eq: body.code };
    if (body.crop) filter["requestData.crop"] = { $regex: body.crop };

    return filter;
  },

  getRequestTraceabilityWithHub: (
    reqCode: string,
    hubId: string,
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true },
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) =>
    Promise.all([
      reqTraceRepo.findByCode(reqCode, options, select),
      hubRepo.findById(hubId)
    ]),

  getRequestTraceabilityWithStoreAndDistrebuter: (
    reqCode: string,
    storeId: string,
    distId: string,
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true },
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) =>
    Promise.all([
      reqTraceRepo.findByCode(reqCode, options, select),
      hubRepo.findById(storeId),
      hubRepo.findById(distId)
    ]),

  getRequestTraceabilityWithDistrebutorAndExport: (
    reqCode: string,
    distId: string,
    planeId: string,
    options: QueryOptions<RequestTraceabilityDocument> = { lean: true },
    select: ProjectionType<RequestTraceabilityDocument> = {}
  ) =>
    Promise.all([
      reqTraceRepo.findByCode(reqCode, options, select),
      hubRepo.findById(distId),
      hubRepo.findById(planeId)
    ]),

  /**
   * @description Returns only the store that matchs the storeId
   * @param {string} code the request code
   * @param {ObjectId} storeId the Store Id
   * @return {Promise<Pick<RequestTraceabilityDocument, "hubStore"| "code"> | null>}
   */
  getStoreAvaliability: async (
    code: string,
    storeId: Types.ObjectId
  ): Promise<Pick<RequestTraceabilityDocument, "hubStore" | "code"> | null> =>
    RequestTraceabilityModel.findOne(
      {
        code: code,
        hubStore: {
          $elemMatch: {
            hubId: storeId
          }
        }
      },
      { "hubStore.$": 1, _id: 0 },
      { lean: true }
    ),

  /**
   * @description Returns All Stores.
   * @param {string} code the request code
   * @return {Promise<Pick<RequestTraceabilityDocument, "hubStore"| "code"> | null>}
   */
  getAllStoresAvaliability: async (
    code: string
  ): Promise<Pick<RequestTraceabilityDocument, "hubStore" | "code"> | null> =>
    RequestTraceabilityModel.findOne(
      {
        code: code
      },
      { hubStore: 1, _id: 0 },
      { lean: true }
    ),

  getRequestTraceWithCode: (code: string) =>
    RequestTraceabilityModel.aggregate(
      getRequestTraceByCodeAgg(code)
    ) as unknown as Promise<unknown>,

  getRequestTraceWithCodeForTree: (code: string) =>
    RequestTraceabilityModel.aggregate(
      RequestTraceabilityOneReportForTreeAgg(code)
    ) as unknown as Promise<unknown>,

  /**
   * updateManyWithNewHubInfo
   * @description Updates all the traces with the new Hub info
   * The issue is that every type of trace has a different name instead of just adding a type to the array xd
   * This was done in an attempt to decrease the query load iirc, I forgot why we did it this way.
   * Looking at it this was a horrible decision.
   * @param {HubDocument} hub already updated.
   * @return {Promise<unknown>} Documents that DON'T Have the updated info (Use new: true if u want updated docs)
   */
  updateManyWithNewHubInfo: (hub: HubDocument) => {
    let name = "";
    switch (hub.type) {
      case "EXPORT":
        name = "hubExport";
        break;
      case "STORE":
        name = "hubStore";
        break;
      case "DISTRIBUTER":
        name = "hubDistributer";
        break;
      default:
        throw new Error("Recieved an unknown type in rename hubs in trace");
    }
    return RequestTraceabilityModel.updateMany<RequestTraceabilityDocument>(
      {
        [`${name}`]: {
          $elemMatch: { hubId: hub._id }
        }
      },
      {
        $set: {
          [`${name}.$.hubCode`]: hub.hubCode,
          [`${name}.$.hubName`]: hub.hubName
        }
      },
      {
        lean: true
      }
    ).exec();
  },

  /**
   * @description Returns only the distributor that matchs the hubId
   * @param {string} code the request code
   * @param {ObjectId} distId the Store Id
   * @return {Promise<Pick<RequestTraceabilityDocument, "hubDistributer"| "code"> | null>}
   */
  getDistAvaliability: async (
    code: string,
    distId: Types.ObjectId
  ): Promise<Pick<
    RequestTraceabilityDocument,
    "hubDistributer" | "code"
  > | null> =>
    RequestTraceabilityModel.findOne(
      {
        code: code,
        hubDistributer: {
          $elemMatch: {
            hubId: distId
          }
        }
      },
      { "hubDistributer.$": 1, _id: 0 }
    )
      .lean()
      .exec(),

  /**
   * @description Returns All distributors.
   * @param {string} code the request code
   * @return {Promise<Pick<RequestTraceabilityDocument, "hubDistributer"| "code"> | null>}
   */
  getAllDistsAvaliability: (
    code: string
  ): Promise<Pick<
    LeanDocument<RequestTraceabilityDocument>,
    "hubDistributer" | "code"
  > | null> =>
    RequestTraceabilityModel.findOne(
      {
        code: code
      },
      { hubDistributer: 1, _id: 0 }
    )
      .lean()
      .exec(),

  getGeneralReport: (year: number) =>
    RequestTraceabilityModel.aggregate(
      requestTraceabilityGeneral(year)
    ) as unknown as Promise<unknown>,

  getHistoryById: async (code: string, id: string | Types.ObjectId) => {
    // Element match returns an array, and puts the found element in the first position
    const result = await RequestTraceabilityModel.findOne(
      {
        code: code,
        history: {
          $elemMatch: {
            _id: id
          }
        }
      },
      { "history.$": 1, _id: 0 }
    )
      .lean()
      .exec();
    return result ? result.history[0] : null;
  },

  aggregateHistoryPdf: function (
    code: string,
    id: Types.ObjectId
  ): Promise<HistoryDataForPdf[]> {
    return RequestTraceabilityModel.aggregate<HistoryDataForPdf>(
      getHistoryUsingCodeAndIdForPdfAgg(code, id)
    ).exec();
  }
};

export default reqTraceRepo;

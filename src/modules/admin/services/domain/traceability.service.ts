/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  FilterQuery,
  HydratedDocument,
  LeanDocument,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery
} from "mongoose";
import { HttpStatus } from "../../../../assets/httpCodes";
import type {
  HubDocument,
  RequestDocument,
  RequestTraceability,
  RequestTraceabilityDocument
} from "../../../../models";
import reqTraceRepo from "../../../../repositories/requestTraceability.repository";
import type { Gpx as IGpx } from "../../../../types";
import { FindResult } from "../../../../types";
import { HttpError, UserError } from "../../../../utils";
import { requestRepo } from "../../../../repositories/request.repository";
import { generateHistoryReqTraceCertPdf } from "../pdf.service";
import { HistoryDataForPdf } from "../../aggregations/pdf/trace.history.cert.agg";
import { ObjectId } from "../../../../helpers/mongodb";

interface ItemsInput {
  variety: string | null;
  amountToAdd: string | null;
}

type FindOne = FindResult<RequestTraceabilityDocument, { lean: false }>;
// type FindOneLean = FindResult<RequestTraceabilityDocument, { lean: true }>;

type FindOneExec =
  Promise<HydratedDocument<RequestTraceabilityDocument> | null>;

// type FindOneExecLean =
//   Promise<LeanDocument<RequestTraceabilityDocument> | null>;

/**
 * @description The main reason for this interface being here is to make the domain layer independent of the database layer
 * and the repository to depend on the domain layer not the other way around.
 */
export interface requestTraceabilityRepo {
  findOne: (
    // eslint-disable-next-line no-unused-vars
    query?: FilterQuery<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => FindOneExec;
  // eslint-disable-next-line no-unused-vars

  findById: (
    // eslint-disable-next-line no-unused-vars
    id: string,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => FindOneExec;

  findByCode: (
    // eslint-disable-next-line no-unused-vars
    code: string,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => FindOneExec;

  Create: (
    // eslint-disable-next-line no-unused-vars
    item: RequestTraceability
  ) => Promise<RequestTraceabilityDocument>;

  findByIdAndUpdate: (
    // eslint-disable-next-line no-unused-vars
    id: string,
    // eslint-disable-next-line no-unused-vars
    update: UpdateQuery<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>
  ) => FindOne;

  findPaginated: (
    // eslint-disable-next-line no-unused-vars
    query: FilterQuery<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    limit: number,
    // eslint-disable-next-line no-unused-vars
    skip: number,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => Promise<LeanDocument<RequestTraceabilityDocument>[] | null>;

  find: (
    // eslint-disable-next-line no-unused-vars
    query: FilterQuery<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => Promise<LeanDocument<RequestTraceabilityDocument>[] | null>;

  // eslint-disable-next-line no-unused-vars
  deleteOneById: (id: string) => FindOne;

  filterSearch: (
    // eslint-disable-next-line no-unused-vars
    body: Record<string, unknown>
  ) => FilterQuery<RequestTraceabilityDocument>;

  getRequestTraceabilityWithHub: (
    // eslint-disable-next-line no-unused-vars
    reqCode: string,
    // eslint-disable-next-line no-unused-vars
    hubId: string,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => Promise<
    [RequestTraceabilityDocument | null, LeanDocument<HubDocument> | null]
  >;

  updateManyWithNewHubInfo: (
    // eslint-disable-next-line no-unused-vars
    hub: HubDocument
  ) => Promise<unknown>;

  getRequestTraceabilityWithStoreAndDistrebuter: (
    // eslint-disable-next-line no-unused-vars
    reqCode: string,
    // eslint-disable-next-line no-unused-vars
    storeId: string,
    // eslint-disable-next-line no-unused-vars
    distId: string,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => Promise<
    [
      RequestTraceabilityDocument | null,
      LeanDocument<HubDocument> | null,
      LeanDocument<HubDocument> | null
    ]
  >;

  getRequestTraceabilityWithDistrebutorAndExport: (
    // eslint-disable-next-line no-unused-vars
    reqCode: string,
    // eslint-disable-next-line no-unused-vars
    distId: string,
    // eslint-disable-next-line no-unused-vars
    planeId: string,
    // eslint-disable-next-line no-unused-vars
    options?: QueryOptions<RequestTraceabilityDocument>,
    // eslint-disable-next-line no-unused-vars
    select?: ProjectionType<RequestTraceabilityDocument>
  ) => Promise<
    [
      RequestTraceabilityDocument | null,
      LeanDocument<HubDocument> | null,
      LeanDocument<HubDocument> | null
    ]
  >;

  getAllDistsAvaliability: (
    // eslint-disable-next-line no-unused-vars
    code: string
  ) => Promise<Pick<
    LeanDocument<RequestTraceabilityDocument>,
    "hubDistributer" | "code"
  > | null>;

  getDistAvaliability: (
    // eslint-disable-next-line no-unused-vars
    code: string,
    // eslint-disable-next-line no-unused-vars
    distId: Types.ObjectId
  ) => Promise<Pick<
    RequestTraceabilityDocument,
    "hubDistributer" | "code"
  > | null>;

  getStoreAvaliability: (
    // eslint-disable-next-line no-unused-vars
    code: string,
    // eslint-disable-next-line no-unused-vars
    storeId: Types.ObjectId
  ) => Promise<Pick<RequestTraceabilityDocument, "hubStore" | "code"> | null>;

  getAllStoresAvaliability: (
    // eslint-disable-next-line no-unused-vars
    code: string
  ) => Promise<Pick<RequestTraceabilityDocument, "hubStore" | "code"> | null>;

  // eslint-disable-next-line no-unused-vars
  getRequestTraceWithCode: (code: string) => Promise<unknown>;

  // eslint-disable-next-line no-unused-vars
  getRequestTraceWithCodeForTree: (code: string) => Promise<unknown>;

  // eslint-disable-next-line no-unused-vars
  getGeneralReport: (year: number) => Promise<unknown>;

  getHistoryById: (
    // eslint-disable-next-line no-unused-vars
    code: string,
    // eslint-disable-next-line no-unused-vars
    id: string | Types.ObjectId
  ) => Promise<LeanDocument<RequestTraceabilityDocument>["history"][0] | null>;

  aggregateHistoryPdf(
    // eslint-disable-next-line no-unused-vars
    code: string,
    // eslint-disable-next-line no-unused-vars
    id: Types.ObjectId
  ): Promise<HistoryDataForPdf[]>;
}

export async function getTraceGeneralReport(year: number) {
  return reqTraceRepo.getGeneralReport(year);
}

export async function getHistoryById(code: string, id: string) {
  return reqTraceRepo.getHistoryById(code, ObjectId(id));
}

export async function deleteOne(id: string) {
  return reqTraceRepo.deleteOneById(id);
}

export async function findByIdAndUpdate(
  id: string,
  requestTrace: RequestTraceability
) {
  return reqTraceRepo.findByIdAndUpdate(id, requestTrace, {
    lean: true,
    new: true
  });
}

export async function getAllDistsAvaliability(code: string) {
  return reqTraceRepo.getAllDistsAvaliability(code);
}

export async function findPaginated(
  query: FilterQuery<RequestTraceabilityDocument>,
  limit: number,
  skip: number
) {
  return reqTraceRepo.findPaginated(
    query,
    limit,
    skip,
    {
      lean: true
    },
    {
      _id: 1,
      code: 1,
      gpxTimestamp: 1,
      "requestData.farm.color": 1,
      "requestData.farm.createdAt": 1,
      "requestData.farm.owner": 1,
      "requestData.crop": 1
    }
  );
}

export async function filterSearch(query: Record<string, unknown>) {
  return reqTraceRepo.filterSearch(query);
}

export async function getOneByCode(code: string) {
  return reqTraceRepo.findByCode(code, { lean: true });
}

export async function Create(trace: RequestTraceability) {
  return reqTraceRepo.Create(trace);
}

export async function getRequestTraceabilityWithHub(
  reqCode: string,
  hubId: string
) {
  return reqTraceRepo.getRequestTraceabilityWithHub(reqCode, hubId, {
    lean: false
  });
}

export async function getRequestTraceabilityWithStoreAndDistrebuter(
  code: string,
  storeId: string,
  distrebuteId: string
) {
  return reqTraceRepo.getRequestTraceabilityWithStoreAndDistrebuter(
    code,
    storeId,
    distrebuteId,
    {
      lean: false
    }
  );
}

export async function getRequestTraceabilityWithDistrebutorAndExport(
  code: string,
  distrebuteId: string,
  exportId: string
) {
  return reqTraceRepo.getRequestTraceabilityWithDistrebutorAndExport(
    code,
    distrebuteId,
    exportId,
    {
      lean: false
    }
  );
}

export async function getStoreAvaliability(code: string, storeId: string) {
  return reqTraceRepo.getStoreAvaliability(code, ObjectId(storeId));
}

export async function getAllStoresAvaliability(code: string) {
  return reqTraceRepo.getAllStoresAvaliability(code);
}

export async function getRequestTraceWithCode(code: string) {
  return reqTraceRepo.getRequestTraceWithCode(code);
}

export async function getRequestTraceWithCodeForTree(code: string) {
  return reqTraceRepo.getRequestTraceWithCodeForTree(code);
}

export async function getDistAvaliability(code: string, distId: string) {
  return reqTraceRepo.getDistAvaliability(code, ObjectId(distId));
}

/**
 * @function getChargeOrCreateIt
 * @description Get the request traceability charge, if it doesn't exist, it will be created
 * @param {String} code - request code
 * @return {Promise<RequestTraceabilityDocument>}
 * @throws {HttpError} - if request not found or request status is not accept
 * @throws {HttpError} - if variety not found
 */
export async function getChargeOrCreateIt(code: string) {
  const request = await requestRepo.findByCode(code);
  if (!request || request.status !== "accept")
    throw new HttpError("Request not found", HttpStatus.NOT_FOUND);

  let requestTraceabilityEntity = await reqTraceRepo.findByCode(
    request.code,
    { lean: false },
    { charge: 1, code: 1 }
  );

  // First check if the entity exists or not
  if (
    !requestTraceabilityEntity ||
    requestTraceabilityEntity.charge.length < 1
  ) {
    // use Map to get the total area of each variety
    const map = new Map<string, number>();

    request.gpx.forEach(gpx => {
      // get variety from gpx, if it doesn't exist, stop
      if (!gpx.variety)
        throw new HttpError("Variety not found", HttpStatus.NOT_FOUND);
      // append area to the map
      map.set(gpx.variety, (map.get(gpx.variety) || 0) + (gpx.area as number));
    });

    // convert map to array for usage
    const charge: RequestTraceabilityDocument["charge"] = [];

    map.forEach((value, key) =>
      charge.push({
        variety: key,
        area: value,
        currentAmount: 0,
        initialAmount: 0
      })
    );

    /*
     * some times the requestTraceabilityEntity exists but the charge is empty
     * Technically this should never happen, but it happened during testing once
     * better safe than sorry
     * 2023-04-27 11:31 I found the reason, it was because the requestTraceabilityEntity gets created with an empty charge
     * if its updated using {updateCharge} function
     */
    if (requestTraceabilityEntity) {
      requestTraceabilityEntity.charge = charge;
      await requestTraceabilityEntity.save();
    } else
      requestTraceabilityEntity = await reqTraceRepo.Create({
        code: request.code,
        requestData: request as Required<RequestDocument>,
        charge: charge,
        hubDistributer: null,
        hubStore: null,
        hubExport: null,
        history: []
      });
  }
  return requestTraceabilityEntity;
}

/**
 * @function moveChargeFromReqToStore
 * @description Adds amounts to Store
 * @param {RequestTraceabilityDocument} requestTrace - request traceability document
 * @param {HubDocument} hub - store hub document
 * @param {String} userId - user id for history
 * @param {Array<ItemsInput>} itemsToAdd - items to add
 * @return {Promise<RequestTraceabilityDocument>} - updated request traceability document
 * @throws {UserError} - if variety or amount is missing
 * @throws {UserError} - if variety not in request
 * @throws {UserError} - if amount is negative
 * @throws {UserError} - if amount is greater than request amount
 * @throws {UserError} - if hub doesn't have enough amount
 */
export async function moveChargeFromReqToStore(
  requestTrace: RequestTraceabilityDocument,
  hub: LeanDocument<HubDocument>,
  userId: string,
  itemsToAdd: Array<ItemsInput>
) {
  itemsToAdd
    .filter(item => Number(item.amountToAdd) !== 0)
    .map(({ variety, amountToAdd }) => {
      if (!variety || !amountToAdd)
        throw new UserError(
          "Bad variety or amount.",
          "VARIETY OR AMOUNT MISSING",
          "commitItemsToHub"
        );

      const amount = Number(amountToAdd);
      // Decrease Request Amount
      const varietyItemIndex = requestTrace.charge.findIndex(
        item => item.variety === variety
      );

      if (varietyItemIndex < 0)
        throw new UserError(
          "variety not in request!",
          "BAD VARIETY NOT IN REQ",
          "addItemToHub"
        );

      if (requestTrace.charge[varietyItemIndex].currentAmount - amount < 0)
        throw new UserError(
          "Cannot subtract, amount below 0!",
          "BAD AMOUNT",
          "addItemToHub"
        );
      requestTrace.charge[varietyItemIndex].currentAmount -= amount;

      addItemToStore(requestTrace, hub, variety, amount);
    });
  // Add To history
  requestTrace.history.push({
    from: null,
    to: hub._id,
    user: userId,
    transactionType: "CHARGE_TO_STORE",
    createdAt: new Date(),
    payload: itemsToAdd
      .filter(item => Number(item.amountToAdd) !== 0)
      .map(({ variety, amountToAdd: amount }) => {
        return { variety: variety || "", amount: Number(amount || "0") };
      })
  });
  requestTrace.markModified("history");
  requestTrace.markModified("hubStore");
  requestTrace.markModified("charge");
  await requestTrace.save();
  return requestTrace;
}

/**
 * @function addItemToStore
 * @description Adds amount to the store and subtracts it from the request
 * @param {RequestTraceabilityDocument} requestTrace - request traceability document
 * @param {HubDocument} hub - store hub
 * @param {String} variety - variety name
 * @param {Number} amount - amount to add
 * @return {Promise<void>}
 * @throws {UserError} - if variety or amount is missing
 * @throws {UserError} - if variety not found in request
 * @throws {UserError} - if amount is below 0
 * @throws {UserError} - if hub not found in request
 */
export async function addItemToStore(
  requestTrace: RequestTraceabilityDocument,
  hub: LeanDocument<HubDocument>,
  variety: string,
  amount: number
) {
  if (!requestTrace.hubStore) {
    requestTrace.hubStore = [
      {
        hubId: hub._id,
        hubCode: hub.hubCode,
        hubName: hub.hubName,
        holder: [
          {
            variety,
            amount
          }
        ]
      }
    ];
  } else {
    const hubIndex = requestTrace.hubStore.findIndex(
      item => item.hubId.toString() === hub._id.toString()
    );
    if (hubIndex < 0) {
      // Add hub to request
      requestTrace.hubStore.push({
        hubId: hub._id,
        hubCode: hub.hubCode,
        hubName: hub.hubName,
        holder: [
          {
            variety,
            amount
          }
        ]
      });
    } else {
      const varietyIndex = requestTrace.hubStore[hubIndex].holder.findIndex(
        item => item.variety === variety
      );
      if (varietyIndex < 0) {
        requestTrace.hubStore[hubIndex].holder.push({
          variety,
          amount
        });
      } else {
        requestTrace.hubStore[hubIndex].holder[varietyIndex].amount += amount;
      }
    }
  }
}

/**
 * @description Adds or appends amount to the trace charge
 * @param {string} code - the request code to add the amount to
 * @param {string} userId - the user id to add to the history
 * @param {Array<ItemsInput>} body - the items to add
 * @return {Promise<Pick<RequestTraceabilityDocument, "charge">>} the new charge
 */
export async function putChargeInRequest(
  code: string,
  userId: string,
  body: Array<ItemsInput>
) {
  const request = await requestRepo.findByCode(code);

  if (!request || request.status !== "accept")
    throw new HttpError("Request not found!", HttpStatus.NOT_FOUND);

  const entity = await reqTraceRepo.findByCode(code, {
    lean: false
  });
  if (!entity)
    throw new UserError(
      "Cannot Find RequestTraceability! BAD REQUEST CODE",
      "BAD REQ CODE",
      "putChargeInRequest"
    );
  body
    .filter(item => Number(item.amountToAdd) !== 0)
    .map(item => {
      // First check the input
      if (!item.variety || !item.amountToAdd || Number(item.amountToAdd) < 0)
        throw new UserError(
          "Missing/Bad amountToAdd or variety!",
          "BAD INPUT",
          "putChargeInRequest"
        );
      // Find the variety or else throw on missing
      const varietyIndex = entity.charge.findIndex(
        entityItem => entityItem.variety === item.variety
      );
      if (varietyIndex < 0)
        throw new UserError(
          "Cannot find variety in charge!",
          "BAD INPUT SENT, MISSING VARIETY IN CHARGE!",
          "putChargeInRequest"
        );

      // Put the amount.
      entity.charge[varietyIndex].currentAmount += Number(item.amountToAdd);
      entity.charge[varietyIndex].initialAmount += Number(item.amountToAdd);
    });

  // Add To history
  entity.history.push({
    from: null,
    to: null,
    user: userId,
    transactionType: "ADD_CHARGE",
    createdAt: new Date(),
    payload: body
      .filter(item => Number(item.amountToAdd) !== 0)
      .map(({ variety, amountToAdd: amount }) => {
        return { variety: variety || "", amount: Number(amount || "0") };
      })
  });

  entity.markModified("history");
  entity.markModified("charge");
  await entity.save();
  return entity.charge;
}

/**
 * @description Move items from store to distributer
 * @param {RequestTraceabilityDocument} reqTrace - The request traceability document
 * @param {HubDocument} store - The store to move items from
 * @param {HubDocument} distributer - The distributer to move items to
 * @param {string} userId - The user id of the user making the request
 * @param {Array<ItemsInput>} itemsToAdd - The items to add to the distributer
 * @return {Promise<RequestTraceabilityDocument>} - The updated request traceability document
 * @throws {UserError} - If the request doesn't have any stores
 * @throws {UserError} - If the store doesn't exist for this request
 * @throws {UserError} - If the request doesn't have any distributers
 * @throws {UserError} - If the distributer doesn't exist for this request
 * @throws {UserError} - If the amount to add is less than 0
 * @throws {UserError} - If the amount to add is more than the current amount
 */
export async function moveItemsToDistFromStore(
  reqTrace: RequestTraceabilityDocument,
  store: LeanDocument<HubDocument>,
  distributer: LeanDocument<HubDocument>,
  userId: string,
  itemsToAdd: Array<ItemsInput>
) {
  // Get the store
  if (!reqTrace.hubStore)
    throw new UserError(
      "Request doesnt have any stores",
      "REQ MISSING STORE",
      "moveItemsToDistFromStore"
    );
  const storeIndex = reqTrace?.hubStore!.findIndex(
    reqStore => reqStore.hubId.toString() === store._id.toString()
  );
  if (storeIndex < 0)
    throw new UserError(
      "Store doesn't exist for this request.",
      "STORE MISSING FROM REQ",
      "moveItemsToDistFromStore"
    );
  if (!reqTrace.hubDistributer) reqTrace.hubDistributer = [];

  // Get the distributer
  let distIndex = reqTrace.hubDistributer.findIndex(
    reqDist => reqDist.hubId.toString() === distributer._id.toString()
  );
  if (distIndex < 0) {
    reqTrace.hubDistributer.push({
      hubId: distributer._id,
      hubCode: distributer.hubCode,
      hubName: distributer.hubName,
      holder: []
    });
    distIndex = reqTrace.hubDistributer.length - 1;
  }
  itemsToAdd
    .filter(item => Number(item.amountToAdd) !== 0)
    .map(({ variety, amountToAdd: amount }) => {
      // Validate Input
      if (!variety || !amount)
        throw new UserError(
          "Missing amountToAdd or variety!",
          "BAD INPUT",
          "putChargeInRequest"
        );
      const storeHolderIndex = reqTrace.hubStore![storeIndex].holder.findIndex(
        item => item.variety === variety
      );
      if (storeHolderIndex < 0)
        throw new UserError(
          "Variety doesn't exist in store!",
          "VARIETY MISSING IN REQ STORE",
          "moveItemsToDistFromStore"
        );
      reqTrace.hubStore![storeIndex].holder[storeHolderIndex].amount -=
        Number(amount);
      if (reqTrace.hubStore![storeIndex].holder[storeHolderIndex].amount < 0)
        throw new UserError(
          "Cannot be below 0 in Store amount!",
          "BAD AMOUNT SENT FROM CLIENT",
          "moveItemsToDistFromStore"
        );

      const distHolderIndex = reqTrace.hubDistributer![
        distIndex
      ].holder.findIndex(dist => dist.variety === variety);
      if (distHolderIndex < 0)
        reqTrace.hubDistributer![distIndex].holder.push({
          variety: variety,
          amount: Number(amount)
        });
      else
        reqTrace.hubDistributer![distIndex].holder[distHolderIndex].amount +=
          Number(amount);
    });
  // Add To history
  reqTrace.history.push({
    from: store._id,
    to: distributer._id,
    user: userId,
    transactionType: "STORE_TO_DISTRIBUTER",
    createdAt: new Date(),
    payload: itemsToAdd
      .filter(item => Number(item.amountToAdd) !== 0)
      .map(({ variety, amountToAdd: amount }) => {
        return { variety: variety || "", amount: Number(amount || "0") };
      })
  });
  reqTrace.markModified("history");
  reqTrace.markModified("hubDistributer");
  reqTrace.markModified("hubStore");
  return reqTrace.save();
}

/**
 * @function moveItemsFromDistributorToExport
 * @description Move items from a distributor to an export
 * @param {RequestTraceabilityDocument} reqTrace - The traceability document
 * @param {HubDocument} distributer - The distributer to move from
 * @param {HubDocument} exporterHub - The exporter to move to
 * @param {string} userId - The user id of the user making the request
 * @param {Array<ItemsInput>} itemsToAdd - The items to add
 * @return {Promise<RequestTraceabilityDocument>} - The updated traceability document
 * @throws {UserError} - If the request doesn't have any distributors
 * @throws {UserError} - If the store doesn't exist for this request
 * @throws {UserError} - If the variety doesn't exist in the store
 * @throws {UserError} - If the amount is below 0
 * @throws {UserError} - If the variety doesn't exist in the distributor
 */
export async function moveItemsFromDistributorToExport(
  reqTrace: RequestTraceabilityDocument,
  distributer: LeanDocument<HubDocument>,
  exporterHub: LeanDocument<HubDocument>,
  userId: string,
  itemsToAdd: Array<ItemsInput>
) {
  // Get the distributer
  if (!reqTrace.hubDistributer)
    throw new UserError(
      "Request doesnt have any distributors",
      "REQ MISSING STORE",
      "moveItemsToPlaneFromDist"
    );

  const distIndex = reqTrace?.hubDistributer!.findIndex(
    reqDist => reqDist.hubId.toString() === distributer._id.toString()
  );

  if (distIndex < 0)
    throw new UserError(
      "Store doesn't exist for this request.",
      "STORE MISSING FROM REQ",
      "moveItemsToPlaneFromDist"
    );

  if (!reqTrace.hubExport) reqTrace.hubExport = [];

  // Get the export
  let exportIndex = reqTrace.hubExport.findIndex(
    reqDist => reqDist.hubId.toString() === distributer._id.toString()
  );

  if (exportIndex < 0) {
    reqTrace.hubExport.push({
      hubId: exporterHub._id,
      hubCode: exporterHub.hubCode,
      hubName: exporterHub.hubName,
      holder: []
    });
    exportIndex = reqTrace.hubExport.length - 1;
  }

  itemsToAdd
    .filter(item => Number(item.amountToAdd) !== 0)
    .map(({ variety, amountToAdd: amount }) => {
      // Validate Input
      if (!variety || !amount)
        throw new UserError(
          "Missing amountToAdd or variety!",
          "BAD INPUT",
          "moveItemsToPlaneFromDist"
        );
      const distHolderIndex = reqTrace.hubDistributer![
        distIndex
      ].holder.findIndex(item => item.variety === variety);
      if (distHolderIndex < 0)
        throw new UserError(
          "Variety doesn't exist in hubDistributer!",
          "VARIETY MISSING IN REQ DIST",
          "moveItemsToPlaneFromDist"
        );
      reqTrace.hubDistributer![distIndex].holder[distHolderIndex].amount -=
        Number(amount);
      if (
        reqTrace.hubDistributer![distIndex].holder[distHolderIndex].amount < 0
      )
        throw new UserError(
          "Cannot be below 0 in amount!",
          "BAD AMOUNT SENT FROM CLIENT",
          "moveItemsToPlaneFromDist"
        );

      const planeHolderIndex = reqTrace.hubExport![
        exportIndex
      ].holder.findIndex(dist => dist.variety === variety);

      if (planeHolderIndex < 0)
        reqTrace.hubExport![exportIndex].holder.push({
          variety: variety,
          amount: Number(amount)
        });
      else
        reqTrace.hubExport![exportIndex].holder[planeHolderIndex].amount +=
          Number(amount);
    });

  // Add To history
  reqTrace.history.push({
    from: distributer._id,
    to: exporterHub._id,
    user: userId,
    transactionType: "DISTRIBUTER_TO_EXPORT",
    createdAt: new Date(),
    payload: itemsToAdd
      .filter(item => Number(item.amountToAdd) !== 0)
      .map(({ variety, amountToAdd: amount }) => {
        return { variety: variety || "", amount: Number(amount || "0") };
      })
  });

  reqTrace.markModified("history");
  reqTrace.markModified("hubDistributer");
  reqTrace.markModified("hubExport");
  return reqTrace.save();
}

/**
 * @description Recreates the charge of the request
 * @param {string} code - The code of the request
 * @param {Array<IGpx>} GPX - The gpx to add
 * @return {Promise<RequestTraceabilityDocument>} - The updated traceability document
 *
 */
export async function updateCharge(code: string, GPX: Array<IGpx>) {
  try {
    const reqTrace = await reqTraceRepo.findByCode(code, { lean: false });

    // if no reqTrace to update return
    if (!reqTrace) return;

    const map = new Map<string, number>();

    GPX.forEach(gpx => {
      // usually gpx.variety is null at the beginning of the gpx upload
      if (gpx.variety)
        map.set(
          gpx.variety,
          (map.get(gpx.variety) || 0) + (gpx.area as number)
        );
    });

    const charge: RequestTraceabilityDocument["charge"] = [];

    map.forEach((value, key) =>
      charge.push({
        variety: key,
        area: value,
        currentAmount: 0,
        initialAmount: 0
      })
    );
    reqTrace.charge = charge;
    return reqTrace.save();
  } catch (err) {
    console.error(err);
  }
}

export async function getHistoryCertificateData(
  historyId: Types.ObjectId | string,
  code: string
) {
  return await reqTraceRepo.aggregateHistoryPdf(code, ObjectId(historyId));
}

export async function getHistoryCertificate(
  historyId: string | Types.ObjectId,
  code: string
) {
  const data = await getHistoryCertificateData(historyId, code);

  if (!data || data.length === 0)
    throw new HttpError("No data found", HttpStatus.NOT_FOUND);

  return generateHistoryReqTraceCertPdf(data[0]);
}

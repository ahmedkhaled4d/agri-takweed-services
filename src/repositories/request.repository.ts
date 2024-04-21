import type {
  ClientSession,
  FilterQuery,
  LeanDocument,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery
} from "mongoose";
import { ObjectId } from "../helpers/mongodb";
import {
  CropDocument,
  CropModel,
  LocationDocument,
  LocationModel,
  Request,
  RequestDocument,
  RequestModel,
  RequestPopulatedForReport
} from "../models";
import { HttpError } from "../utils";

export const requestRepo = {
  findOne: (
    query: FilterQuery<RequestDocument>,
    options: QueryOptions<RequestDocument> = { lean: true },
    select: ProjectionType<RequestDocument> = {}
  ) => RequestModel.findOne(query, select, options).lean().exec(),

  findById: (
    id: string,
    options: QueryOptions<RequestDocument> = { lean: true },
    select: ProjectionType<RequestDocument> = {}
  ) => RequestModel.findById(id, select, options).exec(),

  findByCode: (
    code: string,
    options: QueryOptions<RequestDocument> = { lean: false },
    select: ProjectionType<RequestDocument> = {}
  ) => RequestModel.findOne({ code: code }, select, options).exec(),

  Create: (item: Request) => RequestModel.create(item),

  findByIdAndUpdate: (
    id: string | Types.ObjectId,
    update: UpdateQuery<RequestDocument>,
    options: QueryOptions<RequestDocument> = {
      lean: true,
      new: true,
      runValidators: true
    }
  ) => RequestModel.findByIdAndUpdate(id, update, options),

  findByCodeAndUpdate: async (
    code: string,
    update: UpdateQuery<RequestDocument>,
    options: QueryOptions<RequestDocument> = { lean: true }
  ) => {
    const req = await RequestModel.findOneAndUpdate({ code }, update, options);
    if (!req) throw new HttpError("Req not found", 404);
    return req;
  },

  find: (
    query: FilterQuery<RequestDocument>,
    limit = 10,
    skip = 0,
    options: QueryOptions<RequestDocument> = { lean: true },
    select: ProjectionType<RequestDocument> = {}
  ) =>
    RequestModel.find(query, select, options)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .exec(),

  deleteOne: (id: string) => RequestModel.findOneAndDelete({ _id: id }),

  getRequestData: (
    Id: string,
    options: QueryOptions<RequestDocument> = { lean: true },
    select: ProjectionType<RequestDocument> = {}
  ): Promise<RequestPopulatedForReport | null> =>
    RequestModel.findById<RequestPopulatedForReport>(Id, select, options)
      .populate("crop", `-varieties -createdAt -updatedAt`)
      .populate({
        path: "farm.location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "farm.location.center",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "farm.location.hamlet",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate("user", `-accessToken -password`)
      .exec(),

  getRequestDataByCode: (
    code: string,
    options: QueryOptions<RequestDocument> = { lean: true },
    select: ProjectionType<RequestDocument> = {}
  ): Promise<RequestPopulatedForReport | null> =>
    RequestModel.findOne<RequestPopulatedForReport>({ code }, select, options)
      .populate("crop", `-varieties -createdAt -updatedAt`)
      .populate({
        path: "farm.location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "farm.location.center",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "farm.location.hamlet",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate("user", `-accessToken -password`)
      .exec(),

  generateCodePattern: async (
    governorateItem: LocationDocument | string,
    cropItem: CropDocument | string,
    session?: ClientSession
  ) => {
    let reqCode = "";
    const today = new Date();
    const todayStr = today.toString();

    // Incase we got sent a string
    let governorate: LeanDocument<LocationDocument> | null = null;
    let crop: LeanDocument<CropDocument> | null = null;

    // SPEEDDDDDDDD BABY! THIS IS RETARDED
    [governorate, crop] = await Promise.all([
      (async () => {
        if (
          typeof governorateItem === "string" ||
          // Or Code doesn't exist in obj
          !("code" in governorateItem)
        ) {
          governorate = await LocationModel.findById(governorateItem)
            .lean()
            .exec();
        } else {
          governorate = governorateItem;
        }
        return governorate;
      })(),
      (async () => {
        if (
          typeof cropItem === "string" ||
          // Or Code doesn't exist in obj
          !("code" in cropItem)
        ) {
          crop = await CropModel.findById(cropItem).lean().exec();
        } else {
          crop = cropItem;
        }
        return crop;
      })()
    ]);
    if (!governorate || !crop) {
      return {
        reqCode: null,
        err: "Governorate or Crop not found"
      };
    }

    try {
      /**
       * Issue occurs here if codes are switched, there
       * will be a problem in the code generation
       * as the createdAt newly will have the old code
       * while the other one older will have the new code
       * Need to fix
       *
       * Say we have a code 21010101, and 21010102, we want to switch.
       * When we do that then 21010101 will have 21010102 and 21010102 will have 21010101.
       * Meaning that the newest code will be 21010101, while the older one will be 21010102.
       * So the system will attempt to generate 21010102, but it will find that it already exists. crashing
       */
      const latestRequestWithSameCropAndGov = await RequestModel.findOne(
        {
          $expr: {
            $eq: [{ $year: "$createdAt" }, new Date().getFullYear()]
          },
          crop: ObjectId(crop._id),
          "farm.location.governorate": ObjectId(governorate._id)
        },
        {
          code: 1,
          createdAt: 1
        },
        {
          session
        }
      )
        // Maybe sort by code?
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      // NOTE: 2022-12-04 I have no idea what this is doing and I am scared to touch it
      // INFO: 2023-12-19 I now know what this is doing and I am still scared to touch it
      if (
        latestRequestWithSameCropAndGov === null ||
        // checks if the code is not the same as the current date
        latestRequestWithSameCropAndGov.code.substring(0, 6) !==
          todayStr.substring(13, 15) + governorate.code + crop.code
      ) {
        // Starts counting from 0001 if there is no code
        reqCode =
          todayStr.substring(13, 15) + governorate.code + crop.code + "0001";
      } else {
        // Ofc the code is a string instead of number, anyways increment by 1
        let codeNumbered = parseInt(latestRequestWithSameCropAndGov.code);
        codeNumbered += 1;
        reqCode = codeNumbered.toString();
      }
      return {
        reqCode,
        err: null
      };
    } catch (err) {
      return {
        reqCode: null,
        err: err
      };
    }
  },

  addRequest: async (
    {
      user,
      farm,
      crop,
      varieties,
      mahaseelEngineer,
      plantQuarantineEngineer,
      visitDetails,
      inspectionDate,
      dayOfWeek,
      sampleNumber,
      quality,
      adminUser
    }: Pick<
      Request,
      | "user"
      | "farm"
      | "mahaseelEngineer"
      | "plantQuarantineEngineer"
      | "visitDetails"
      | "inspectionDate"
      | "dayOfWeek"
      | "crop"
      | "varieties"
      | "quality"
      | "adminUser"
      | "sampleNumber"
    >,
    { govObj, cropObj }: { govObj: LocationDocument; cropObj: CropDocument },
    session?: ClientSession
  ) => {
    if (!farm || !crop || !varieties) {
      return {
        data: null,
        message: "Missing some paramters in your body",
        error: true
      };
    }
    const { reqCode, err } = await requestRepo.generateCodePattern(
      govObj,
      cropObj,
      session
    );
    // TODO: Result Pattern!
    if (err || !reqCode) throw err;

    const requestData = await RequestModel.create(
      [
        {
          code: reqCode,
          user: user,
          createdBy: user,
          status: "inprogress",
          farm,
          crop,
          mahaseelEngineer,
          plantQuarantineEngineer,
          visitDetails,
          inspectionDate,
          dayOfWeek,
          sampleNumber,
          varieties,
          adminUser,
          quality
        }
      ],
      { session }
    );

    // NOTE: Was this needed? like at all? I don't think so humph
    // mail.send(
    //   "no-reply@takweedegypt.net",
    //   "info@mahaseel.net",
    //   `New Request for crops: ${reqCode}`,
    //   `we have recived a new request code its link is https://takweedegypt.com/admin/requests/view/${requestData._id.toString()}  plz follow up.`
    // );
    return { data: requestData[0], message: "Request Recived", error: false };
  }
};

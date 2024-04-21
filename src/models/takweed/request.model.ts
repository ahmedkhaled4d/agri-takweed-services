import mongoose from "mongoose";

import { CropDocument, FarmDocument, FarmPopulated, UserDocument } from "../.";
import { Gpx } from "../../types";
import DeletedModel from "../shared/deleted.model";

export interface RequestVarieties {
  name: string;
  parts: number;
  area: {
    value: number;
    unit: string;
  };
  quantity: {
    value: number;
    unit: string;
  };
  picking: {
    from: string;
    to: string;
  };
}

export interface Request {
  code: string;
  dayOfWeek: string;
  inspectionDate: string;
  mahaseelEngineer: string;
  plantQuarantineEngineer: string;
  visitDetails: string;
  user: UserDocument["_id"];
  createdBy: UserDocument["_id"];
  adminUser?: UserDocument["_id"];
  sampleNumber: string;
  certificate: string;
  cancelled: boolean;
  status: string;
  farm: FarmDocument;
  crop: CropDocument["_id"];
  varieties: Array<RequestVarieties>;
  quality: Array<unknown>; // Its empty...
  gpx: Array<
    Gpx & {
      estimation?: {
        expected_yield: string;
        plantation_acreage: string;
        total_trees: number;
      };
    } & {
      cropAge?: number;
    } & {
      carbonFootprint?: string;
    }
  >;
  gpxTimestamp?: Date;
  gpxOriginalDate?: Date;
  visitsNumber: number;
  totalArea: number;
}

export interface RequestDocument extends Request, mongoose.Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestPopulatedForReport
  extends Omit<RequestDocument, "crop" | "user" | "farm" | "_id"> {
  crop: Omit<CropDocument, "varieties" | "createdAt" | "updatedAt">;
  user: Omit<UserDocument, "accessToken" | "password">;
  farm: FarmPopulated;
}

const varietiesSchema = new mongoose.Schema<RequestVarieties>(
  {
    name: { type: String, required: true },
    parts: { type: Number, required: true },
    area: { type: Object, required: true },
    quantity: { type: Object, required: true },
    picking: { type: Object, required: true }
  },
  { _id: false, versionKey: false }
);

const RequestSchema = new mongoose.Schema<RequestDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    dayOfWeek: {
      type: String
    },
    inspectionDate: {
      type: String
    },
    mahaseelEngineer: {
      type: String
    },
    plantQuarantineEngineer: {
      type: String
    },
    visitDetails: {
      type: String
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    certificate: {
      type: String,
      default: null
    },
    cancelled: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      required: true,
      enum: ["inprogress", "accept", "reject"]
    },
    farm: {
      type: Object,
      required: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crop",
      required: true
    },
    visitsNumber: {
      type: Number,
      default: 0
    },
    varieties: [varietiesSchema],
    sampleNumber: {
      type: String
    },
    gpx: Array,
    gpxTimestamp: { type: Date, default: null },
    gpxOriginalDate: { type: Date, default: null },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    totalArea: { type: Number, default: 0 }
  },
  { timestamps: true }
);

RequestSchema.post(/Delete/, function (doc) {
  if (doc)
    return DeletedModel.create({
      recordId: doc._id,
      collectionName: "request",
      data: doc,
      type: "delete"
    });
  return;
});

export const RequestModel = mongoose.model<
  RequestDocument,
  mongoose.Model<RequestDocument>
>("request", RequestSchema);

export default RequestModel;

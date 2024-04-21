import mongoose from "mongoose";
import { Point } from "../../types";
import { CropDocument, UserDocument, Location } from "../.";

export interface Store {
  code: string;
  user: mongoose.Types.ObjectId;
  name: string;
  type:
    | "packaging house"
    | "collecting center"
    | "packaging house & collecting center"
    | "carpet";
  requestedBy: string;
  owner: string;
  phone: string;
  ownerPhone: string;
  ownerType:
    | "person"
    | "private sector"
    | "public sector"
    | "governmental entity";
  coordinates: Point;
  crop: mongoose.Types.ObjectId;
  location: {
    governorate: string;
    center: string;
    hamlet: string;
  };
  gpxTimestamp: Date;
  gpxOriginalDate: Date;
  certificate: string | null;
}

export interface StoreDocument extends Store {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreDocumentPopulated
  extends Omit<Store, "crop" | "location" | "user"> {
  crop: Omit<CropDocument, "createdAt" | "updatedAt">;
  location: {
    governorate: Location;
    center: Location;
    hamlet: Location;
  };
  user: Omit<UserDocument, "accessToken" | "password">;
}

const StoreSchema = new mongoose.Schema<StoreDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        "packaging house",
        "collecting center",
        "packaging house & collecting center",
        "carpet"
      ]
    },
    requestedBy: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    ownerPhone: {
      type: String,
      required: true
    },
    ownerType: {
      type: String,
      required: true,
      enum: ["person", "private sector", "public sector", "governmental entity"]
    },
    coordinates: {
      type: Object,
      required: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crop",
      required: true
    },
    location: {
      governorate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "location",
        required: true
      },
      center: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "location",
        required: true
      },
      hamlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "location",
        required: true
      }
    },
    gpxTimestamp: Date,
    gpxOriginalDate: Date,
    certificate: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export const StoreModel = mongoose.model<
  StoreDocument,
  mongoose.Model<StoreDocument>
>("store", StoreSchema);

export default StoreModel;

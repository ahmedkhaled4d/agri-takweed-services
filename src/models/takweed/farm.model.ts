import mongoose from "mongoose";
import { Location } from "./..";

export interface Farm {
  user: mongoose.Types.ObjectId;
  name: string;
  owner: string;
  phone: string;
  representative: string;
  representativePhone: string;
  color: string;
  location: {
    governorate: string;
    center: string;
    hamlet: string;
    address: Record<string, unknown>;
  };
  active: boolean;
}

export interface FarmDocument extends Farm, mongoose.Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmPopulated extends Omit<Farm, "location"> {
  location: {
    governorate: Location;
    center: Location;
    hamlet: Location;
    address: Record<string, unknown>;
  };
}

const FarmSchema = new mongoose.Schema<FarmDocument>(
  {
    representative: {
      type: String
    },
    representativePhone: {
      type: String
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    name: {
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
      },
      address: { type: Object, required: true }
    },
    color: {
      type: String
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const FarmModel = mongoose.model<
  FarmDocument,
  mongoose.Model<FarmDocument>
>("farm", FarmSchema);

export default FarmModel;

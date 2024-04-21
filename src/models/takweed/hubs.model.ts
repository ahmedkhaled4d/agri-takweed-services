/*
 * This is related to store and disrpution centers
 * also transactions
 */
import mongoose from "mongoose";
import { Point } from "../../types";
import { generateTimeStamp } from "../../utils";

export interface Hub {
  hubName: string;
  hubCode: string;
  contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    type: string;
  }>;
  ownerType:
    | "PERSON"
    | "PRIVATE_SECTOR"
    | "PUBLIC_SECTOR"
    | "GOVERNMENTAL_ENTITY";
  type: "STORE" | "DISTRIBUTER" | "EXPORT";
  subType: string;
  // Its location
  location: {
    governorate: mongoose.Types.ObjectId;
    center: mongoose.Types.ObjectId;
    hamlet: mongoose.Types.ObjectId;
    cooredinate?: Point;
    address?: Record<string, string>;
  };
  details: {
    operatingCapacity: number; // The amount in it currently
    storageCapacity: number;
    BRCCertificate?: boolean;
    area?: number;
    measuringUnit?: string;
    coolingUnits?: number; // Cooler
    refrigeratedVolumes?: number; // fast cooler
    rented?: boolean;
    rating?: number;
  };
}

export interface HubDocument extends Omit<Hub, "location">, mongoose.Document {
  _id: string;
  location: {
    governorate: mongoose.Types.ObjectId;
    center: mongoose.Types.ObjectId;
    hamlet: mongoose.Types.ObjectId;
    cooredinate?: Point;
    address?: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const hubSchema = new mongoose.Schema<HubDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ["STORE", "DISTRIBUTER", "EXPORT"]
    },
    contacts: {
      type: [
        {
          name: { type: String },
          phone: { type: String },
          email: { type: String, required: false },
          type: { type: String }
        }
      ],
      required: true
    },
    subType: {
      type: String,
      required: true
    },
    hubName: {
      type: String
    },
    hubCode: {
      type: String,
      unique: true,
      default: generateTimeStamp
    },
    // Its location
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
      cooredinate: {
        type: Object,
        lat: { type: Number },
        lng: { type: Number },
        required: false
      },
      address: { type: Object, required: false }
    },
    details: {
      type: Object,
      required: false,
      BRCCertificate: { type: Boolean, required: false, default: false },
      area: { type: Number, required: false, default: 0 },
      measuringUnit: { type: String },
      coolingUnits: { type: Number, required: false, default: 0 },
      refrigeratedVolumes: { type: Number, required: false, default: 0 },
      rented: { type: Boolean, required: false, default: false },
      rating: { type: Number, required: false, default: 0 },
      operatingCapacity: { type: Number },
      storageCapacity: { type: Number }
    },
    ownerType: {
      type: String,
      enum: ["PERSON", "PRIVATE_SECTOR", "PUBLIC_SECTOR", "GOVERNMENTAL_ENTITY"]
    }
  },
  { timestamps: true }
);

export const HubModel = mongoose.model<
  HubDocument,
  mongoose.Model<HubDocument>
>("hub", hubSchema);

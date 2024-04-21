import mongoose from "mongoose";

export interface Location {
  name_ar: string;
  name_en: string;
  code: string;
  active: boolean;
  type: string;
  parent: mongoose.Types.ObjectId | null;
  coordinates: Array<number>;
  adminData: mongoose.Types.ObjectId;
}

export interface LocationDocument extends Location {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new mongoose.Schema<LocationDocument>(
  {
    name_ar: {
      type: String,
      required: true
    },
    name_en: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      required: true,
      enum: ["governorate", "center", "hamlet"]
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "locations",
      default: null
    },
    coordinates: {
      type: [Number],
      required: false
    },
    adminData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    }
  },
  { timestamps: true }
);

export const LocationModel = mongoose.model<
  LocationDocument,
  mongoose.Model<LocationDocument>
>("location", locationSchema);

export default LocationModel;

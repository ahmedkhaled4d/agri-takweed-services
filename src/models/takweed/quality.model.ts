import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface Quality {
  name_ar: string;
  name_en: string;
  active: boolean;
}

export interface QualityDocument extends Quality {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

const QualitySchema = new Schema(
  {
    name_ar: {
      type: String,
      required: true
    },
    name_en: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const QualityModel = mongoose.model("quality", QualitySchema);

export default QualityModel;

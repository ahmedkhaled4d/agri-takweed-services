import mongoose from "mongoose";

export interface CropVarieties {
  _id: string;
  name_ar: string;
  name_en: string;
  estimatable?: boolean;
}

export interface Crop {
  name_ar: string;
  name_en: string;
  code: string;
  color: string;
  active: boolean;
  varieties: Array<CropVarieties>;
}

export interface CropDocument extends Crop, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const VarietiesSchema = new mongoose.Schema<CropVarieties>({
  name_ar: String,
  name_en: String,
  estimatable: {
    type: Boolean,
    default: false,
    required: false
  }
});

const CropSchema = new mongoose.Schema<Crop>(
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
    color: {
      type: String
    },
    active: {
      type: Boolean,
      default: true
    },
    varieties: [VarietiesSchema]
  },
  { timestamps: true }
);

export const CropModel = mongoose.model<CropDocument>("crop", CropSchema);

export default CropModel;

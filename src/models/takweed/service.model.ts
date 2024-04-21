import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ServiceSchema = new Schema(
  {
    name_ar: {
      type: String,
      required: true
    },
    name_en: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["general", "agricultural", "other"]
    }
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.model("service", ServiceSchema);

export default ServiceModel;

import mongoose from "mongoose";
const Schema = mongoose.Schema;

const InitialSchema = new Schema(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
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
    docs: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "documents",
      required: true
    },
    varieties: {
      type: Array,
      name: { type: String, required: true },
      parts: { type: Number, required: true },
      area: { type: Object, required: true },
      quantity: { type: Object, required: true },
      picking: { type: Object, required: true }
    },
    quality: Array
  },
  { timestamps: true }
);

export const InitialModel = mongoose.model("initial", InitialSchema);

export default InitialModel;

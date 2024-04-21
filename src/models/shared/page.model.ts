import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PageSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: Array,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const PageModel = mongoose.model("page", PageSchema);

export default PageModel;

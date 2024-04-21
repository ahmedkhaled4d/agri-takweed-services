import mongoose from "mongoose";
const Schema = mongoose.Schema;

const newsLetterSchema = new Schema(
  {
    email: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const NewsLetterModel = mongoose.model("Newsletter", newsLetterSchema);

export default NewsLetterModel;

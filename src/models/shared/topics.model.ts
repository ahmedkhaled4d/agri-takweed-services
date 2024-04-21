import mongoose from "mongoose";
const Schema = mongoose.Schema;

const topicsSchema = new Schema(
  {
    name: {
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

export const TopicsModel = mongoose.model("topic", topicsSchema);
export default TopicsModel;

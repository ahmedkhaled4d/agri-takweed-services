import mongoose from "mongoose";
import { generateTimeStamp } from "../../utils";

export interface Orders {
  _id?: string;
  farmName: string;
  code: string;
  url: string;
  visit: boolean;
  id: string;
}

export interface Committee {
  committeeDate: Date;
  comitteeCode: string;
  mahaseelUser: string;
  hagrUser: string;
  farms: Array<Orders>;
  deleted: boolean;
  status: "inprogress" | "accept" | "reject";
}

export interface CommitteeDoc
  extends mongoose.Document,
    Omit<Committee, "mahaseelUser" | "hagrUser"> {
  mahaseelUser: mongoose.Types.ObjectId;
  hagrUser: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}

const OrdersSchema = new mongoose.Schema<Orders>({
  farmName: { type: String },
  url: { type: String },
  code: { type: String },
  visit: { type: Boolean, default: false }
});

const CommitteeSchema = new mongoose.Schema(
  {
    committeeDate: {
      type: Date,
      required: true
    },
    comitteeCode: {
      type: String,
      default: generateTimeStamp
    },
    mahaseelUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    hagrUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    farms: {
      type: [OrdersSchema]
    },
    status: {
      type: String,
      default: "accept",
      enum: ["inprogress", "accept", "reject"]
    }
  },
  { timestamps: true, versionKey: false }
);

export const CommitteeModel = mongoose.model<Committee>(
  "committee",
  CommitteeSchema
);

export default CommitteeModel;

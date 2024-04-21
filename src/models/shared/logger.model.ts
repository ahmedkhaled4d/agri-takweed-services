import mongoose from "mongoose";

export interface Logger {
  userId?: string;
  action: string;
  type: "info" | "error" | "debug" | "bad_request";
  resource: string;
  payload?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  contentLength?: number;
}

export interface LoggerDocument
  extends Omit<Logger, "userId">,
    mongoose.Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LoggerSchema = new mongoose.Schema<LoggerDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    type: {
      type: String,
      default: "info",
      enum: ["info", "error", "debug", "bad_request"]
    },
    action: {
      type: String
    },
    payload: {
      type: Object
    },
    resource: {
      type: String
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    contentLength: {
      type: Number
    }
  },
  { timestamps: true, versionKey: false, collection: "logger" }
);

export const LoggerModel = mongoose.model("logger", LoggerSchema);

export default LoggerModel;

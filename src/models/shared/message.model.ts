import mongoose from "mongoose";

export interface Message {
  user: string;
  title: string;
  content: string;
  sender: string | "Mahaseel";
}

export interface MessageDocument extends Message, mongoose.Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      trim: true
    },
    sender: {
      type: String,
      default: "Mahaseel"
    }
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<Message>("message", MessageSchema);

export default MessageModel;

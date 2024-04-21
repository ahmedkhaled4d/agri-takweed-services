import mongoose from "mongoose";

export interface Deleted {
  recordId: string;
  collectionName: string;
  data: Record<string, unknown>;
  type: "delete" | "update";
}

export interface DeletedDocument extends Deleted, mongoose.Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeletedSchema = new mongoose.Schema<DeletedDocument>(
  {
    recordId: {
      type: String
    },
    collectionName: {
      type: String,
      required: true
    },
    data: {
      type: Object
    },
    type: {
      type: String,
      default: "delete"
    }
  },
  { timestamps: true, versionKey: false, collection: "deleted" }
);

// Prevent updating these records.
DeletedSchema.pre(/update/, () => {
  throw new Error("Cannot Update deleted!");
});

export const DeletedModel = mongoose.model<DeletedDocument>(
  "deleted",
  DeletedSchema
);

export default DeletedModel;

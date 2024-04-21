import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface DocLinks {
  id: string;
  agricultureAssociation: string;
  ownership: string;
  possesion: string;
  otherImg: string;
}
export interface Doc {
  code: string;
  user: string;
  requestType: ["takweed", "loan"];
  docLinks: DocLinks;
  pdfLink: string;
}

export interface DocDocument extends Doc {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocSchema = new Schema(
  {
    code: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },

    requestType: {
      type: String,
      required: true,
      enum: ["takweed", "loan"]
    },
    docLinks: {
      type: Object,
      required: true
    },
    pdfLink: {
      type: String
    }
  },
  { timestamps: true }
);

export const UserDocumentModel = mongoose.model("document", DocSchema);

export default UserDocumentModel;

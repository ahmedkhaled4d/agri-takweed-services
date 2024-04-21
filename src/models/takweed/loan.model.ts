import mongoose from "mongoose";
const Schema = mongoose.Schema;

const LoanSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    loanValue: {
      type: Number,
      required: true
    },
    NoOfRequests: {
      type: Number,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    cancelled: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      required: true,
      enum: ["inprogress", "accept", "reject"]
    },
    serviceNames: {
      type: [String],
      required: true
    },
    serviceId: {
      type: [mongoose.Types.ObjectId],
      ref: "service",
      required: true
    }
  },
  { timestamps: true }
);

export const LoanModel = mongoose.model("loan", LoanSchema);

export default LoanModel;

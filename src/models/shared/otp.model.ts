import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true
    },
    createdAt: { type: Date, expires: "2m", default: Date.now }
  },
  { versionKey: false }
);

export const OTPModel = mongoose.model("otp", OtpSchema);

export default OTPModel;

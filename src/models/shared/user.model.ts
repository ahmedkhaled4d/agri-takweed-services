import mongoose from "mongoose";

export type permission = "checkQR" | "CanDeleteLogs";

export interface Permission {
  key: permission;
  value: boolean;
}

export type Permissions = Array<Permission>;

export interface User {
  name: string;
  email: string;
  password: string;
  phone: string;
  tradeId?: string;
  otp: string;
  otpExpireOn: Date;
  otpVerified: boolean;
  role: "client" | "admin" | "hagr" | "engineer" | "coordinator";
  nid: Record<string, unknown>;
  fcm: string;
  nationalId: string;
  device: Record<string, unknown>;
  permissions: Permissions;
  reviewer: boolean;
}

export interface UserDocument extends User, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export const defaultPerms: Permissions = [
  {
    key: "checkQR",
    value: false
  },
  {
    key: "CanDeleteLogs",
    value: false
  }
];

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    password: {
      type: String
    },
    phone: {
      type: String,
      required: [true, "You must add phone number ..!"],
      unique: true,
      trim: true
    },
    otp: { type: String },
    otpExpireOn: { type: Date },
    otpVerified: { type: Boolean, default: false },
    role: {
      type: String,
      default: "client",
      enum: ["client", "admin", "hagr", "engineer"]
    },
    permissions: {
      type: [Object],
      default: defaultPerms
    },
    fcm: {
      type: String
    },
    nationalId: {
      type: String
    },
    tradeId: {
      type: String
    },
    device: {
      type: Object
    },
    nid: {
      type: Object
    },
    reviewer: {
      type: Boolean
    }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>("user", UserSchema);

export default UserModel;

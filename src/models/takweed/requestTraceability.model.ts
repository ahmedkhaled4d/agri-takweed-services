import mongoose from "mongoose";
import { UserDocument, RequestDocument, HubDocument } from "../.";

interface ReqHistory {
  _id?: mongoose.Types.ObjectId;
  from: HubDocument["_id"] | null;
  to: HubDocument["_id"] | null;
  user: UserDocument["_id"];
  transactionType:
    | "STORE_TO_DISTRIBUTER"
    | "CHARGE_TO_STORE"
    | "ADD_CHARGE"
    | "DISTRIBUTER_TO_EXPORT";
  createdAt: Date;
  payload: Array<{
    variety: string;
    amount: number;
  }>;
}

export interface RequestTraceability {
  code: RequestDocument["code"];
  requestData: {
    _id: RequestDocument["_id"];
    crop: RequestDocument["crop"];
    farm: Pick<RequestDocument["farm"], "owner" | "phone">;
    gpxTimestamp: Required<RequestDocument["gpxTimestamp"]>;
  };
  charge: Array<{
    variety: string;
    area: number;
    currentAmount: number;
    initialAmount: number;
  }>;
  hubStore: Array<{
    hubId: HubDocument["_id"];
    hubCode: HubDocument["hubCode"];
    hubName: HubDocument["hubName"];
    holder: Array<{
      variety: string;
      amount: number;
    }>;
  }> | null;
  // TODO: Change spelling to Distributor
  hubDistributer: Array<{
    hubId: HubDocument["_id"];
    hubCode: HubDocument["hubCode"];
    hubName: HubDocument["hubName"];
    holder: Array<{
      variety: string;
      amount: number;
    }>;
  }> | null;
  hubExport: Array<{
    hubId: HubDocument["_id"];
    hubCode: HubDocument["hubCode"];
    hubName: HubDocument["hubName"];
    holder: Array<{
      variety: string;
      amount: number;
    }>;
  }> | null;
  history: ReqHistory[];
}

export interface RequestTraceabilityDocument
  extends RequestTraceability,
    mongoose.Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new mongoose.Schema<
  RequestTraceabilityDocument["history"][0]
>({
  transactionType: { type: String },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hub",
    required: false
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hub",
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  createdAt: Date,
  payload: {
    type: [Object],
    variety: { type: String },
    amount: { type: Number }
  }
});

const requestTraceabilitySchema =
  new mongoose.Schema<RequestTraceabilityDocument>(
    {
      code: {
        type: String,
        ref: "request",
        unique: true,
        required: true
      },
      requestData: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "request",
          required: true
        },
        crop: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "crop",
          required: true
        },
        farm: {
          type: Object,
          owner: { type: String },
          phone: { type: String }
        },
        gpxTimestamp: { type: Date }
      },
      charge: {
        type: [Object],
        variety: { type: String },
        area: { type: Number },
        currentAmount: { type: Number },
        initialAmount: { type: Number }
      },
      hubStore: {
        type: [Object],
        hubId: { type: String },
        hubCode: { type: Number },
        hubName: { type: String },
        holder: {
          type: [Object],
          variety: { type: String },
          amount: { type: Number }
        },
        required: false
      },
      hubDistributer: {
        type: [Object],
        hubId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "hub",
          required: false
        },
        hubCode: { type: String },
        hubName: { type: String },
        holder: {
          type: [Object],
          variety: { type: String },
          amount: { type: Number }
        },
        required: false
      },
      hubExport: {
        type: [Object],
        hubId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "hub",
          required: false
        },
        hubCode: { type: String },
        hubName: { type: String },
        holder: {
          type: [Object],
          variety: { type: String },
          amount: { type: Number }
        },
        required: false
      },
      history: [historySchema]
    },
    { timestamps: true }
  );

export const RequestTraceabilityModel = mongoose.model<
  RequestTraceabilityDocument,
  mongoose.Model<RequestTraceabilityDocument>
>("requestTraceability", requestTraceabilitySchema);

import mongoose from "mongoose";
import { CropDocument } from "./crop.model";
const Schema = mongoose.Schema;

export interface Polygon {
  type: "Polygon";
  coordinates: Array<Array<Array<number>>>;
  intersections: Array<unknown>;
  crop: CropDocument["_id"];
  code: string;
  gpxDate: Date;
  farmName: string;
  owner: string;
  point: string;
  area: number | null;
  season: Date;
}

const GeoSchema = new Schema({
  polygons: {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true
    },
    coordinates: {
      type: [[[Number]]] // Array of arrays of arrays of numbers
    },
    intersections: [],
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crop",
      required: true
    },
    code: {
      type: String,
      ref: "request",
      required: true
    },
    gpxDate: {
      type: Date,
      required: true
    },
    farmName: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    point: {
      type: String,
      required: true
    },
    area: {
      type: Number,
      required: true
    },
    season: {
      type: Date
    }
  }
});

export const GeometryModel = mongoose.model("geometry", GeoSchema);

export default GeometryModel;

import mongoose from "mongoose";

export interface Weather {
  lat: number;
  lng: number;
  daily: Record<string, string | Date | number>;
}

// WARN: This is deprecated, use
// `type WeatherDocument = ReturnType<(typeof Weather)['hydrate']>;`
//  instead if you want the hydrated document type
export interface WeatherDocument extends Weather, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const WeatherSchema = new mongoose.Schema<WeatherDocument>(
  {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    daily: {
      type: Object,
      required: true
    }
  },
  { timestamps: true }
);

// WARN: Mongoose models no longer support passing document type.
export const WeatherModel = mongoose.model<WeatherDocument>(
  "weather",
  WeatherSchema
);

export default WeatherModel;

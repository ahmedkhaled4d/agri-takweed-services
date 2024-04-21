import { FilterQuery, QueryOptions, ProjectionType } from "mongoose";
import { WeatherDocument, WeatherModel, Weather } from "../models";

export const WeatherRepository = {
  findOne: (
    query: FilterQuery<WeatherDocument>,
    options: QueryOptions<WeatherDocument> | undefined = {}
  ) => WeatherModel.findOne(query, options).lean().exec(),

  findById: (
    id: string,
    options: QueryOptions<WeatherDocument> | undefined = {}
  ) => WeatherModel.findById(id, options).lean().exec(),

  Create: (item: Weather) => WeatherModel.create(item),

  find: (
    query: FilterQuery<WeatherDocument>,
    limit = 10,
    skip = 0,
    options: QueryOptions<WeatherDocument> | undefined = {},
    select: ProjectionType<WeatherDocument> = {}
  ) =>
    WeatherModel.find(query, select, options)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean()
      .exec(),

  updateOne: (query: FilterQuery<WeatherDocument>, update: Partial<Weather>) =>
    WeatherModel.findOneAndUpdate(query, update, { new: true }),

  updateById: (id: string, update: Partial<Weather>) =>
    WeatherModel.findByIdAndUpdate(id, update, { new: true }),

  deleteOne: (query: FilterQuery<WeatherDocument>) =>
    WeatherModel.findOneAndDelete(query),

  deleteById: (id: string) => WeatherModel.findByIdAndDelete(id),

  getTodayWeather: ({ lat, lng }: { lat: number; lng: number }) =>
    WeatherModel.findOne({
      lat,
      lng,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59))
      }
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec()
};

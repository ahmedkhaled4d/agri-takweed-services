/* eslint-disable no-unused-vars */
import { WeatherResponse } from "./weather.type";

export interface AbstractWeatherService {
  getCurrentWeatherUsingLatLng(
    lat: number,
    lon: number,
    language: string
  ): Promise<WeatherResponse>;

  getWeatherForecastForSingleDayUsingLatLng(
    lat: number,
    lon: number,
    day: number,
    language: string
  ): Promise<WeatherResponse>;

  getWeatherForecastForMultipleDaysUsingLatLng(
    lat: number,
    lon: number,
    days: number,
    language: string
  ): Promise<Array<WeatherResponse>>;
}

export * from "./weatherApi/weather.service";

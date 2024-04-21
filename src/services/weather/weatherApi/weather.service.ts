import { HttpStatus } from "../../../assets/httpCodes";
import { HttpError } from "../../../utils";
import { WeatherResponse } from "../weather.type";
import { WeatherApiResponse } from "./type";
import fetch from "node-fetch";

const url = "http://api.weatherapi.com/v1/current.json";

export const getCurrentWeatherUsingLatLng = async (
  lat: number,
  lon: number
): Promise<WeatherResponse> => {
  const res: WeatherApiResponse = await fetch(
    `${url}?key=${process.env.WEATHER_API_KEY}&q=${lat},${lon}`
  )
    .then(res => {
      if (!res.ok)
        res.json().then(err => {
          console.error(err);
          throw new HttpError(
            "Failed to fetch weather data",
            HttpStatus.SERVICE_UNAVAILABLE
          );
        });

      return res.json();
    })
    .catch(err => {
      console.error(err);
      throw new HttpError(
        "Failed to fetch weather data",
        HttpStatus.SERVICE_UNAVAILABLE
      );
    });

  return {
    date: new Date(res.current.last_updated).toISOString(),
    description: res.current.condition.text,
    wind: res.current.wind_kph,
    wind_unit: "kph",
    wind_direction: res.current.wind_dir as "North" | "South" | "East" | "West",
    pressure: res.current.pressure_mb,
    pressure_unit: "mb",
    precipitation: res.current.precip_mm,
    precipitation_unit: "mm",
    humidity: res.current.humidity,
    humidity_unit: "%",
    cloud: res.current.cloud,
    feels_like: res.current.feelslike_c,
    feels_like_unit: "C",
    visibility: res.current.vis_km,
    visibility_unit: "km",
    uv: res.current.uv,
    gust: res.current.gust_kph,
    gust_unit: "kph",
    temperature: res.current.temp_c,
    high_temperature: res.current.temp_c,
    low_temperature: res.current.temp_c,
    icon: res.current.condition.icon
  } as WeatherResponse;
};

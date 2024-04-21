export type WeatherResponse = {
  date: Date | string;
  temperature: number;
  high_temperature: number;
  low_temperature: number;
  description: string;
  wind: number;
  wind_unit: string;
  wind_direction:
    | "North"
    | "South"
    | "East"
    | "West"
    | "North-East"
    | "North-West"
    | "South-East"
    | "South-West";
  pressure: number;
  pressure_unit: string;
  precipitation: number;
  precipitation_unit: string;
  humidity: number;
  humidity_unit: string;
  cloud: number;
  feels_like: number;
  feels_like_unit: string;
  visibility: number;
  visibility_unit: string;
  uv: number;
  gust: number;
  gust_unit: string;
};

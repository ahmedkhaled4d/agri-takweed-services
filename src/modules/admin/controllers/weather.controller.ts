import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../../../assets/httpCodes";
import { getCurrentWeatherUsingLatLng } from "../../../services/weather/weatherApi/weather.service";
import { isPositiveNumberOrZero } from "../../../utils";
import { WeatherRepository } from "../../../repositories/weather.repository";

export const CurrentWeather = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lat, lng } = req.query;
    if (
      !lat ||
      !lng ||
      !isPositiveNumberOrZero(lat) ||
      !isPositiveNumberOrZero(lng)
    ) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: "Missing lat or lng query parameter" });
    }

    const cached = await WeatherRepository.getTodayWeather({
      lat: Number(lat),
      lng: Number(lng)
    });

    if (cached) {
      return res.status(HttpStatus.OK).json({ data: cached.daily });
    }

    const data = await getCurrentWeatherUsingLatLng(Number(lat), Number(lng));
    await WeatherRepository.Create({
      lat: Number(lat),
      lng: Number(lng),
      daily: data
    });
    return res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
};

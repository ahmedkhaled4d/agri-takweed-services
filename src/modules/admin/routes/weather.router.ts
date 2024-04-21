import { Router } from "express";
import * as WeatherController from "../controllers/weather.controller";

const weatherRouter = Router();

weatherRouter.get("/current", WeatherController.CurrentWeather);

export default weatherRouter;

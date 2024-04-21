/* import { HttpError } from "../../../utils"; */
/* import { AbstractWeatherService } from "../weather.service"; */
/* import { WeatherResponse } from "../weather.type"; */
/* import { */
/*   AzureForecaseWeatherApiResponse, */
/*   AzureWeatherApiResponse, */
/*   AzureWeatherDailyForecast, */
/*   AzureWeatherQuartelyForecast */
/* } from "./type"; */
/**/
/* const currentWeatherUrl = */
/*   "https://atlas.microsoft.com/weather/currentConditions/json"; */
/**/
/* const forecast = "https://atlas.microsoft.com/weather/forecast/daily/json"; */
/**/
/* const hourlyForecast = */
/*   "https://atlas.microsoft.com/weather/forecast/hourly/json"; */
/**/
/* const quertlyForecast = */
/*   "https://atlas.microsoft.com/weather/forecast/quarterDay/json"; */
/**/
/* export const AzureWeatherApiService: AbstractWeatherService & { */
/*   // eslint-disable-next-line no-unused-vars */
/*   getWeatherWindDirection(item: string): WeatherResponse["wind_direction"]; */
/*   // eslint-disable-next-line no-unused-vars */
/*   getDay(day: number): number; */
/*   // eslint-disable-next-line no-unused-vars */
/*   getDuration(day: number): number; */
/*   getQuarterDayForecast( */
/*     // eslint-disable-next-line no-unused-vars */
/*     lat: number, */
/*     // eslint-disable-next-line no-unused-vars */
/*     lon: number, */
/*     // eslint-disable-next-line no-unused-vars */
/*     day: number, */
/*     // eslint-disable-next-line no-unused-vars */
/*     language: string */
/*   ): Promise<AzureWeatherQuartelyForecast>; */
/* } = { */
/*   getWeatherWindDirection(item: string): WeatherResponse["wind_direction"] { */
/*     switch (item) { */
/*       case "N": */
/*         return "North"; */
/*       case "S": */
/*         return "South"; */
/*       case "E": */
/*         return "East"; */
/*       case "W": */
/*         return "West"; */
/*       case "NE": */
/*         return "North-East"; */
/*       case "NW": */
/*         return "North-West"; */
/*       case "SE": */
/*         return "South-East"; */
/*       case "SW": */
/*         return "South-West"; */
/*       default: */
/*         return item as WeatherResponse["wind_direction"]; */
/*     } */
/*   }, */
/**/
/*   async getCurrentWeatherUsingLatLng( */
/*     lat: number, */
/*     lon: number, */
/*     language = "en" */
/*   ): Promise<WeatherResponse> { */
/*     try { */
/*       const url = `${currentWeatherUrl}?api-version=1.1&language=${language}&query=${lat},${lon}&subscription-key=${this.configService.getAzureMapsKey()}`; */
/*       console.log(url); */
/*       const res = await this.httpService.get(url); */
/*       if (res?.status !== 200) { */
/*         console.error(`Error getting weather data ${res?.status}`); */
/*         if (res) { */
/*           const resBody = await this.httpService.toJson(res); */
/*           console.error(JSON.stringify(resBody)); */
/*         } */
/*         throw new ServiceUnavailableException(); */
/*       } */
/**/
/*       const resBody = await this.httpService.toJson<AzureWeatherApiResponse>( */
/*         res */
/*       ); */
/**/
/*       if (!resBody?.results?.length) { */
/*         console.error("No results found"); */
/*         console.error(JSON.stringify(resBody)); */
/*         throw new ServiceUnavailableException(); */
/*       } */
/*       const weatherData = resBody.results[0]; */
/**/
/*       return { */
/*         date: weatherData.dateTime, */
/*         temperature: weatherData.temperature.value, */
/*         high_temperature: */
/*           weatherData.temperatureSummary.past6Hours.maximum.value, */
/*         low_temperature: */
/*           weatherData.temperatureSummary.past6Hours.minimum.value, */
/*         description: weatherData.phrase, */
/*         wind: weatherData.wind.speed.value, */
/*         wind_unit: weatherData.wind.speed.unit, */
/*         wind_direction: this.getWeatherWindDirection( */
/*           weatherData.wind.direction.localizedDescription */
/*         ), */
/*         pressure: weatherData.pressure.value, */
/*         pressure_unit: weatherData.pressure.unit, */
/*         precipitation: weatherData.precipitationSummary.past24Hours.value, */
/*         precipitation_unit: weatherData.precipitationSummary.past24Hours.unit, */
/*         humidity: weatherData.relativeHumidity, */
/*         humidity_unit: "%", */
/*         cloud: weatherData.cloudCover, */
/*         feels_like: weatherData.realFeelTemperature.value, */
/*         feels_like_unit: weatherData.realFeelTemperature.unit, */
/*         visibility: weatherData.visibility.value, */
/*         visibility_unit: weatherData.visibility.unit, */
/*         uv: weatherData.uvIndex, */
/*         gust: weatherData.windGust.speed.value, */
/*         gust_unit: weatherData.windGust.speed.unit */
/*       }; */
/*     } catch (e) { */
/*       // bubble it up */
/*       if (e instanceof ServiceUnavailableException) throw e; */
/*       console.error(e); */
/*       throw new ServiceUnavailableException(); */
/*     } */
/*   }, */
/**/
/*   getDay(day: number): number { */
/*     // allowed are 1, 5, 10, 15, 25, 45 */
/*     if (day === 1) return 1; */
/*     if (day > 1 && day <= 5) return 5; */
/*     if (day > 5) return 10; */
/*     if (day > 10) return 15; */
/*     if (day > 15) return 25; */
/*     if (day > 25) return 45; */
/*     throw new Error("Invalid Day, cannot forecast more than 45 days."); */
/*   }, */
/**/
/*   getDuration(day: number): number { */
/*     // allowed are 1, 12, 24, 72(3 days), 120(5 days), 240(10 days) */
/*     if (day === 1) return 24; */
/*     if (day < 4) return 72; */
/*     if (day < 6) return 120; */
/*     if (day < 11) return 240; */
/*     throw new Error("Invalid Day, cannot forecast more than 45 days."); */
/*   }, */
/**/
/*   async getWeatherForecastForMultipleDaysUsingLatLng( */
/*     lat: number, */
/*     lon: number, */
/*     days: number */
/*   ): Promise<Array<WeatherResponse>> { */
/*     if (days > 14) */
/*       throw new Error("Invalid Day, cannot forecast more than 14 days."); */
/*     // Azure allows 5, 10, 15 days */
/*     const azureAllowedDay = this.getDay(days); */
/*     const res = await this.httpService.get( */
/*       `${forecast}?query=${lat},${lon}&duration=${azureAllowedDay}&subscription-key=${this.configService.getAzureMapsKey()}` */
/*     ); */
/**/
/*     if (res?.status !== 200) { */
/*       console.error(`Error getting weather data ${res?.status}`); */
/*       if (res) { */
/*         const resBody = await this.httpService.toJson(res); */
/*         console.error(JSON.stringify(resBody)); */
/*       } */
/*       throw new ServiceUnavailableException(); */
/*     } */
/**/
/*     const resBody = */
/*       await this.httpService.toJson<AzureForecaseWeatherApiResponse>(res); */
/**/
/*     if (!resBody?.forecasts?.length) { */
/*       console.error("No results found"); */
/*       console.error(JSON.stringify(resBody)); */
/*       throw new ServiceUnavailableException(); */
/*     } */
/**/
/*     const now = new Date(); */
/*     const date = new Date(now.setDate(now.getDate() + days - 1)); */
/*     const weatherData = resBody.forecasts.find( */
/*       item => new Date(item.date).getDate() === date.getDate() */
/*     ); */
/**/
/*     if (!weatherData) { */
/*       console.log(`Date >> ${date}`); */
/*       console.log(`Weather Data >> ${JSON.stringify(resBody)}`); */
/*       throw new ServiceUnavailableException(); */
/*     } */
/**/
/*     throw new Error("Not implemented"); */
/*     // return { */
/*     //   date: weatherData.date, */
/*     //   temperature: weatherData.temperature.maximum.value, */
/*     //   description: weatherData.day.longPhrase, */
/*     //   wind: weatherData.day.wind.speed.value, */
/*     //   wind_unit: weatherData.day.wind.speed.unit, */
/*     //   wind_direction: this.getWeatherWindDirection( */
/*     //     weatherData.day.wind.direction.localizedDescription, */
/*     //   ), */
/*     //   pressure: weatherData.day., */
/*     //   pressure_unit: weatherData.day.pressure.unit, */
/*     //   precipitation: weatherData.day.precipitationSummary.precipitation.value, */
/*     //   precipitation_unit: */
/*     //     weatherData.day.precipitationSummary.precipitation.unit, */
/*     //   humidity: weatherData.day.relativeHumidity, */
/*     //   humidity_unit: '%', */
/*     //   cloud: weatherData.day.cloudCover, */
/*     //   feels_like: weatherData.day.realFeelTemperatureShade.value, */
/*     //   feels_like_unit: weatherData.day.realFeelTemperatureShade.unit, */
/*     //   visibility: weatherData.day.visibility.value, */
/*     //   visibility_unit: weatherData.day.visibility.unit, */
/*     //   uv: weatherData.day.uvIndex, */
/*     //   gust: weatherData.day.windGust.speed.value, */
/*     //   gust_unit: weatherData.day.windGust.speed.unit, */
/*     // } */
/*   }, */
/**/
/*   async getWeatherForecastForSingleDayUsingLatLng( */
/*     lat: number, */
/*     lon: number, */
/*     day: number, */
/*     language = "en" */
/*   ): Promise<WeatherResponse> { */
/*     if (day > 14) */
/*       throw new Error("Invalid Day, cannot forecast more than 14 days."); */
/**/
/*     const azureAllowedDuration = this.getDuration(day); */
/**/
/*     const res = await this.httpService.get( */
/*       `${hourlyForecast}?api-version=1.1&language=${language}&query=${lat},${lon}&duration=${azureAllowedDuration}&subscription-key=${this.configService.getAzureMapsKey()}` */
/*     ); */
/**/
/*     if (res?.status !== 200) { */
/*       console.error(`Error getting weather data status: ${res?.status}`); */
/*       if (res) { */
/*         const resBody = await this.httpService.toJson(res); */
/*         console.error(JSON.stringify(resBody)); */
/*       } */
/*       throw new ServiceUnavailableException(); */
/*     } */
/**/
/*     const resBody = await this.httpService.toJson<AzureWeatherDailyForecast>( */
/*       res */
/*     ); */
/**/
/*     if (!resBody?.forecasts?.length) { */
/*       console.error("No results found"); */
/*       console.error(JSON.stringify(resBody)); */
/*       throw new ServiceUnavailableException(); */
/*     } */
/**/
/*     const now = new Date(); */
/*     now.setMinutes(0); */
/*     now.setSeconds(0); */
/*     now.setMilliseconds(0); */
/*     // set to current hour */
/*     const date = new Date(now.setDate(now.getDate() + day - 1)); */
/**/
/*     // forecasts dates start from 1 hour each element has an hour. */
/*     // Find the first element that matches the date to the nearest hour */
/*     const hourlyWeatherData = resBody.forecasts.find( */
/*       item => new Date(item.date).getDate() === date.getDate() */
/*     ); */
/**/
/*     if (!hourlyWeatherData) { */
/*       console.log(`Date >> ${date}`); */
/*       console.log(`Weather Data >> ${JSON.stringify(resBody)}`); */
/*       throw new ServiceUnavailableException(); */
/*     } */
/*     const quartlyWeatherData = await this.getQuarterDayForecast( */
/*       lat, */
/*       lon, */
/*       day, */
/*       language */
/*     ); */
/**/
/*     return { */
/*       date: hourlyWeatherData.date, */
/*       temperature: hourlyWeatherData.temperature.value, */
/*       high_temperature: quartlyWeatherData.temperature.maximum.value, */
/*       low_temperature: quartlyWeatherData.temperature.minimum.value, */
/*       description: hourlyWeatherData.iconPhrase, */
/*       wind: hourlyWeatherData.wind.speed.value, */
/*       wind_unit: hourlyWeatherData.wind.speed.unit, */
/*       wind_direction: this.getWeatherWindDirection( */
/*         hourlyWeatherData.wind.direction.localizedDescription */
/*       ), */
/*       pressure: 0, */
/*       pressure_unit: "mb", */
/*       precipitation: quartlyWeatherData.precipitationProbability, */
/*       precipitation_unit: "%", */
/*       humidity: hourlyWeatherData.relativeHumidity, */
/*       humidity_unit: "%", */
/*       cloud: hourlyWeatherData.cloudCover, */
/*       feels_like: hourlyWeatherData.realFeelTemperature.value, */
/*       feels_like_unit: hourlyWeatherData.realFeelTemperature.unit, */
/*       visibility: hourlyWeatherData.visibility.value, */
/*       visibility_unit: hourlyWeatherData.visibility.unit, */
/*       uv: hourlyWeatherData.uvIndex, */
/*       gust: hourlyWeatherData.windGust.speed.value, */
/*       gust_unit: hourlyWeatherData.windGust.speed.unit */
/*     }; */
/*   }, */
/**/
/*   async getQuarterDayForecast( */
/*     lat: number, */
/*     lon: number, */
/*     day: number, */
/*     language: string */
/*   ) { */
/*     const days = this.getDay(day); */
/**/
/*     const res = await this.httpService.get( */
/*       `${quertlyForecast}?api-version=1.1&language=${language}&query=${lat},${lon}&duration=${days}&subscription-key=${this.configService.getAzureMapsKey()}` */
/*     ); */
/**/
/*     if (res?.status !== 200) { */
/*       console.error(`Error getting weather data status: ${res?.status}`); */
/*       if (res) { */
/*         const resBody = await this.httpService.toJson(res); */
/*         console.error(JSON.stringify(resBody)); */
/*       } */
/*       throw new HttpError("Something went wrong", 500); */
/*     } */
/**/
/*     const resBody = await this.httpService.toJson<AzureWeatherQuartelyForecast>( */
/*       res */
/*     ); */
/**/
/*     if (!resBody?.forecasts?.length) { */
/*       console.error("No results found"); */
/*       console.error(JSON.stringify(resBody)); */
/*       throw new HttpError("Something went wrong", 500); */
/*     } */
/*     const date = new Date(); */
/*     date.setHours(0); */
/*     date.setMinutes(0); */
/*     date.setSeconds(0); */
/*     date.setMilliseconds(0); */
/*     const item = resBody.forecasts.find( */
/*       item => new Date(item.date).getDate() === date.getDate() */
/*     ); */
/*     if (!item) { */
/*       console.log(`Date >> ${date}`); */
/*       console.log(`Weather Quartly Data >> ${JSON.stringify(resBody)}`); */
/*       throw new HttpError("Something went wrong", 500); */
/*     } */
/*     return item; */
/*   } */
/* }; */

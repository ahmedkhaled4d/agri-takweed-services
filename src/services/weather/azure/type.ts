export type AzureWeatherApiResponse = {
  results: Array<{
    dateTime: string;
    phrase: string;
    iconCode: number;
    hasPrecipitation: boolean;
    isDayTime: boolean;
    temperature: { value: number; unit: string; unitType: number };
    realFeelTemperature: { value: number; unit: string; unitType: number };
    realFeelTemperatureShade: {
      value: number;
      unit: string;
      unitType: number;
    };
    relativeHumidity: number;
    dewPoint: { value: number; unit: string; unitType: number };
    wind: {
      direction: { degrees: number; localizedDescription: string };
      speed: { value: number; unit: string; unitType: number };
    };
    windGust: { speed: { value: number; unit: string; unitType: number } };
    uvIndex: number;
    uvIndexPhrase: string;
    visibility: { value: number; unit: string; unitType: number };
    obstructionsToVisibility: string;
    cloudCover: number;
    ceiling: { value: number; unit: string; unitType: number };
    pressure: { value: number; unit: string; unitType: number };
    pressureTendency: { localizedDescription: string };
    past24HourTemperatureDeparture: {
      value: number;
      unit: string;
      unitType: number;
    };
    apparentTemperature: { value: number; unit: string; unitType: number };
    windChillTemperature: { value: number; unit: string; unitType: number };
    wetBulbTemperature: { value: number; unit: string; unitType: number };
    precipitationSummary: {
      pastHour: { value: number; unit: string; unitType: number };
      past3Hours: { value: number; unit: string; unitType: number };
      past6Hours: { value: number; unit: string; unitType: number };
      past9Hours: { value: number; unit: string; unitType: number };
      past12Hours: { value: number; unit: string; unitType: number };
      past18Hours: { value: number; unit: string; unitType: number };
      past24Hours: { value: number; unit: string; unitType: number };
    };
    temperatureSummary: {
      past6Hours: {
        minimum: { value: number; unit: string; unitType: number };
        maximum: { value: number; unit: string; unitType: number };
      };
      past12Hours: {
        minimum: { value: number; unit: string; unitType: number };
        maximum: { value: number; unit: string; unitType: number };
      };
      past24Hours: {
        minimum: { value: number; unit: string; unitType: number };
        maximum: { value: number; unit: string; unitType: number };
      };
    };
  }>;
};

export type AzureForecaseWeatherApiResponse = {
  summary: {
    startDate: string;
    severity: number;
    phrase: string;
    category: string;
  };
  forecasts: [
    {
      date: string;
      temperature: {
        minimum: { value: number; unit: string; unitType: number };
        maximum: { value: number; unit: string; unitType: number };
      };
      realFeelTemperature: {
        minimum: { value: number; unit: string; unitType: number };
        maximum: { value: number; unit: string; unitType: number };
      };
      realFeelTemperatureShade: {
        minimum: { value: number; unit: string; unitType: number };
        maximum: { value: number; unit: string; unitType: number };
      };
      hoursOfSun: number;
      degreeDaySummary: {
        heating: { value: number; unit: string; unitType: number };
        cooling: { value: number; unit: string; unitType: number };
      };
      airAndPollen: [
        {
          name: string;
          value: number;
          category: string;
          categoryValue: number;
          type: string;
        },
        { name: string; categoryValue: number },
        { name: string; categoryValue: number },
        { name: string; categoryValue: number },
        { name: string; categoryValue: number },
        { name: string; categoryValue: number }
      ];
      day: {
        iconCode: number;
        iconPhrase: string;
        hasPrecipitation: false;
        shortPhrase: string;
        longPhrase: string;
        precipitationProbability: number;
        thunderstormProbability: number;
        rainProbability: number;
        snowProbability: number;
        iceProbability: number;
        wind: {
          direction: { degrees: number; localizedDescription: string };
          speed: { value: number; unit: string; unitType: number };
        };
        windGust: {
          direction: { degrees: number; localizedDescription: string };
          speed: { value: number; unit: string; unitType: number };
        };
        totalLiquid: { value: number; unit: string; unitType: number };
        rain: { value: number; unit: string; unitType: number };
        snow: { value: number; unit: string; unitType: number };
        ice: { value: number; unit: string; unitType: number };
        hoursOfPrecipitation: number;
        hoursOfRain: number;
        hoursOfSnow: number;
        hoursOfIce: number;
        cloudCover: number;
      };
      night: {
        iconCode: number;
        iconPhrase: string;
        hasPrecipitation: false;
        shortPhrase: string;
        longPhrase: string;
        precipitationProbability: number;
        thunderstormProbability: number;
        rainProbability: number;
        snowProbability: number;
        iceProbability: number;
        wind: {
          direction: { degrees: number; localizedDescription: string };
          speed: { value: number; unit: string; unitType: number };
        };
        windGust: {
          direction: { degrees: number; localizedDescription: string };
          speed: { value: number; unit: string; unitType: number };
        };
        totalLiquid: { value: number; unit: string; unitType: number };
        rain: { value: number; unit: string; unitType: number };
        snow: { value: number; unit: string; unitType: number };
        ice: { value: number; unit: string; unitType: number };
        hoursOfPrecipitation: number;
        hoursOfRain: number;
        hoursOfSnow: number;
        hoursOfIce: number;
        cloudCover: number;
      };
      sources: [string];
    }
  ];
};

export type AzureWeatherDailyForecast = {
  forecasts: Array<{
    date: string;
    iconCode: number;
    iconPhrase: string;
    hasPrecipitation: boolean;
    isDaylight: boolean;
    temperature: {
      value: number;
      unit: string;
      unitType: number;
    };
    realFeelTemperature: {
      value: number;
      unit: string;
      unitType: number;
    };
    wetBulbTemperature: {
      value: number;
      unit: string;
      unitType: number;
    };
    dewPoint: {
      value: number;
      unit: string;
      unitType: number;
    };
    wind: {
      direction: {
        degrees: number;
        localizedDescription: string;
      };
      speed: {
        value: number;
        unit: string;
        unitType: number;
      };
    };
    windGust: {
      speed: {
        value: number;
        unit: string;
        unitType: number;
      };
    };
    relativeHumidity: number;
    visibility: {
      value: number;
      unit: string;
      unitType: number;
    };
    cloudCover: number;
    ceiling: {
      value: number;
      unit: string;
      unitType: number;
    };
    uvIndex: number;
    uvIndexPhrase: string;
    precipitationProbability: number;
    rainProbability: number;
    snowProbability: number;
    iceProbability: number;
    totalLiquid: {
      value: number;
      unit: string;
      unitType: number;
    };
    rain: {
      value: number;
      unit: string;
      unitType: number;
    };
    snow: {
      value: number;
      unit: string;
      unitType: number;
    };
    ice: {
      value: number;
      unit: string;
      unitType: number;
    };
  }>;
};

export type AzureWeatherQuartelyForecast = {
  forecasts: [
    {
      date: string;
      effectiveDate: string;
      quarter: number;
      iconCode: number;
      iconPhrase: string;
      phrase: string;
      temperature: {
        minimum: {
          value: number;
          unit: string;
          unitType: number;
        };
        maximum: {
          value: number;
          unit: string;
          unitType: number;
        };
      };
      realFeelTemperature: {
        minimum: {
          value: number;
          unit: string;
          unitType: number;
        };
        maximum: {
          value: number;
          unit: string;
          unitType: number;
        };
      };
      dewPoint: {
        value: number;
        unit: string;
        unitType: number;
      };
      relativeHumidity: number;
      wind: {
        direction: {
          degrees: number;
          localizedDescription: string;
        };
        speed: {
          value: number;
          unit: string;
          unitType: number;
        };
      };
      windGust: {
        direction: {
          degrees: number;
          localizedDescription: string;
        };
        speed: {
          value: number;
          unit: string;
          unitType: number;
        };
      };
      visibility: {
        value: number;
        unit: string;
        unitType: number;
      };
      cloudCover: number;
      hasPrecipitation: boolean;
      precipitationType: string;
      precipitationIntensity: string;
      precipitationProbability: number;
      thunderstormProbability: number;
      totalLiquid: {
        value: number;
        unit: string;
        unitType: number;
      };
      rain: {
        value: number;
        unit: string;
        unitType: number;
      };
      snow: {
        value: number;
        unit: string;
        unitType: number;
      };
      ice: {
        value: number;
        unit: string;
        unitType: number;
      };
    }
  ];
};

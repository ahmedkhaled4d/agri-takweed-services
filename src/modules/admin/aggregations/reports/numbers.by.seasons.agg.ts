import { PipelineStage } from "mongoose";

const STARTING_YEAR = 2020;

const createGroupStage = (startingYear: number, endYear: number) => {
  const yearStages = Array.from({ length: endYear - startingYear + 1 }).map(
    (_, i) => createYearStage(startingYear + i)
  );

  // groupStages is the initial group stage, it needs to be merged with the yearStages
  const groupStages = {
    $group: {
      _id: "$cropName",
      total: {
        $sum: {
          $size: "$gpx"
        }
      },
      total_feddan: {
        $sum: "$totalArea"
      },
      ...yearStages.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    }
  };

  return groupStages;
};

const createYearStage = (year: number) => ({
  [year]: {
    $sum: {
      $cond: [{ $eq: ["$seasonYear", year] }, { $size: "$gpx" }, 0]
    }
  },
  [`total${year}_feddan`]: {
    $sum: {
      $cond: [{ $eq: ["$seasonYear", year] }, "$totalArea", 0]
    }
  }
});

const createYearProjectionStage = (startingYear: number, endYear: number) => {
  const yearStages = Array.from({ length: endYear - startingYear + 1 }).map(
    (_, i) => createYearProjection(startingYear + i)
  );

  return yearStages.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

const createYearProjection = (year: number) => ({
  [year]: 1,
  [`total${year}_feddan`]: 1
});

export const NumbersBySeasonYearReportAgg: Array<PipelineStage> = [
  {
    $match: {
      gpxTimestamp: { $exists: true },
      $expr: {
        $isArray: "$gpx"
      }
    }
  },
  {
    $lookup: {
      from: "crops",
      localField: "crop",
      foreignField: "_id",
      as: "Crop"
    }
  },
  {
    $unwind: "$Crop"
  },
  {
    $addFields: {
      seasonYear: { $year: "$gpxTimestamp" },
      cropName: { _id: "$Crop._id", name: "$Crop.name_ar" }
    }
  },
  createGroupStage(
    STARTING_YEAR,
    new Date().getFullYear()
  ) as unknown as PipelineStage,
  {
    $project: {
      _id: 0,
      cropId: "$_id._id",
      cropName: "$_id.name",
      total: 1,
      ...createYearProjectionStage(STARTING_YEAR, new Date().getFullYear())
    }
  }
];

import { PipelineStage } from "mongoose";
export const pointsAgg: Array<PipelineStage> = [
  {
    $project: {
      size_of_gpx: {
        $size: {
          $ifNull: ["$gpx", []]
        }
      },
      size_of_gpx_condition: {
        $gt: [
          {
            $size: {
              $ifNull: ["$gpx", []]
            }
          },
          0
        ]
      },
      code: 1,
      farmName: "$farm.name",
      createdAt: 1,
      updatedAt: 1,
      gpx: 1
    }
  },
  {
    $match: {
      size_of_gpx_condition: {
        $eq: true
      }
    }
  },
  {
    $unwind: {
      path: "$gpx"
    }
  },
  {
    $project: {
      code: 1,
      farmName: "$farmName",
      createdAt: 1,
      updatedAt: 1,
      gpx: 1
    }
  },
  {
    $sort: {
      updatedAt: -1
    }
  }
];

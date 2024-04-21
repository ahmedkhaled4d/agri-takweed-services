import { PipelineStage } from "mongoose";

export const PlotsCountAgg = (year: string): Array<PipelineStage> => [
  {
    $match: {
      createdAt: {
        $gt: new Date(`${year}-01-01`), // start date
        $lt: new Date(`${year}-12-31`) // end date
      },
      status: "accept",
      certificate: { $ne: null }
    }
  },
  {
    $group: {
      _id: null,
      plotsCount: {
        $sum: { $size: { $ifNull: ["$gpx", []] } }
      }
    }
  }
];

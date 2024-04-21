import type { PipelineStage } from "mongoose";

export const PlotTotalArea = (year: string): Array<PipelineStage> => [
  {
    $match: {
      status: "accept",
      createdAt: {
        $gt: new Date(`${year}-01-01`), // start date
        $lt: new Date(`${year}-12-31`) // end date
      }
    }
  },
  {
    $group: {
      _id: 0,
      amount: {
        $sum: "$totalArea"
      }
    }
  },
  {
    $project: {
      _id: 0,
      amount: "$amount"
    }
  }
];

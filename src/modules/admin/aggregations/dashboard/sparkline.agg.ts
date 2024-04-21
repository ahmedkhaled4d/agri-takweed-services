import { PipelineStage } from "mongoose";

// https://stackoverflow.com/questions/27750974/group-by-date-intervals

export const GetTwoMonthsAreas: Array<PipelineStage> = [
  {
    $match: {
      totalArea: { $gt: 0 },
      // 2 months, 60 days
      createdAt: {
        $gte: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 60)
      }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      count: { $sum: "$totalArea" }
    }
  },
  { $sort: { _id: 1 } },
  {
    $group: {
      _id: null,
      data: {
        $push: "$count"
      }
    }
  }
];

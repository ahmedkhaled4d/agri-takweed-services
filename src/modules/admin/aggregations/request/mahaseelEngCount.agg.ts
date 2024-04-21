import { PipelineStage } from "mongoose";

export const getMahaseelEngCount = (
  startDate: Date,
  endDate: Date
): Array<PipelineStage> => [
  {
    $match: {
      mahaseelEngineer: { $ne: null },
      createdAt: {
        $gt: new Date(startDate),
        $lt: new Date(endDate)
      }
    }
  },
  {
    $group: {
      _id: "$mahaseelEngineer",
      count: { $count: {} }
    }
  },
  {
    $project: {
      _id: 0,
      count: 1,
      name: "$_id"
    }
  }
];

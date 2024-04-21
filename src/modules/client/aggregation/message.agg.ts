import { PipelineStage } from "mongoose";

export const MessageListAgg = (
  filter: Record<string, unknown>,
  limit: number,
  skip: number
): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $sort: {
      createdAt: -1
    }
  },
  {
    $limit: limit
  },
  {
    $skip: skip
  }
];

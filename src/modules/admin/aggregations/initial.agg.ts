import { PipelineStage } from "mongoose";

export const ListinitialAgg = ({
  filter,
  sortby,
  sortvalue,
  limit,
  skip
}: {
  filter: Record<string, unknown>;
  sortby: string[] | string | null | undefined;
  sortvalue: number | string;
  limit: number;
  skip: number;
}): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $project: {
      code: 1,
      crop: 1,
      cancelled: 1,
      createdAt: 1,
      "farm.name": 1,
      "farm.owner": 1
    }
  },
  {
    $sort: {
      [sortby as string]: sortvalue as 1 | -1
    }
  },
  { $limit: limit },
  { $skip: skip }
];

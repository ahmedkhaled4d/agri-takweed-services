import { PipelineStage } from "mongoose";

export const CropItemsAgg = ({
  filter,
  sortby,
  sortvalue,
  limit,
  skip
}: {
  filter: Record<string, Record<string, string> | boolean>;
  sortby: string[] | string | null | undefined;
  sortvalue: number | string;
  limit: number;
  skip: number;
}): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $sort: {
      [sortby as string]: sortvalue as 1 | -1
    }
  },
  { $limit: limit },
  { $skip: skip }
];

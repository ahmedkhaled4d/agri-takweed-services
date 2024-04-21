import { PipelineStage } from "mongoose";

export const subscriberList = ({
  sortby,
  sortvalue,
  limit,
  skip
}: {
  sortby: string;
  sortvalue: number;
  limit: number;
  skip: number;
}): Array<PipelineStage> => [
  {
    $sort: {
      [sortby as string]: sortvalue as 1 | -1
    }
  },
  { $limit: limit },
  { $skip: skip }
];

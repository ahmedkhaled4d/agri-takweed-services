import { PipelineStage } from "mongoose";

export const PostsListAgg = ({
  filter,
  sortby,
  sortvalue,
  limit,
  skip
}: {
  filter: Record<string, Record<string, string | unknown>>;
  sortby: string[] | string | null | undefined;
  sortvalue: number | string;
  limit: number;
  skip: number;
}): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $lookup: {
      from: "topics",
      localField: "topicId",
      foreignField: "_id",
      as: "topic"
    }
  },

  { $unset: "topicId" },
  { $unwind: "$topic" },
  // { $unset: "content" },
  {
    $sort: {
      [sortby as string]: sortvalue as 1 | -1
    }
  },
  { $limit: limit },
  { $skip: skip }
];

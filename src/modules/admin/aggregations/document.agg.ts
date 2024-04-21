import { PipelineStage } from "mongoose";

export const DocumentListAgg = ({
  filter,
  sortby,
  sortvalue,
  limit,
  skip
}: {
  filter: Record<string, unknown>;
  sortby: string;
  sortvalue: number;
  limit: number;
  skip: number;
}): Array<PipelineStage> => [
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userData"
    }
  },
  {
    $unwind: {
      path: "$userData"
    }
  },
  {
    $project: {
      code: "$code",
      docLinks: "$docLinks",
      requestType: "$requestType",
      userName: "$userData.name",
      userPhone: "$userData.phone"
    }
  },
  {
    $match: filter
  },
  {
    $sort: {
      [sortby]: sortvalue as 1 | -1
    }
  },
  { $limit: limit },
  { $skip: skip }
];

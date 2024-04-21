import { PipelineStage } from "mongoose";

export const ListRequests = ({
  filter,
  sortby,
  sortvalue,
  limit,
  skip
}: {
  filter: Record<string, Record<string, string | unknown | Date>>;
  sortby: string[] | string | null | undefined;
  sortvalue: number;
  limit: number;
  skip: number;
}): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $project: {
      code: 1,
      status: 1,
      crop: 1,
      cancelled: 1,
      createdAt: 1,
      "farm.name": 1,
      "farm.owner": 1,
      season: {
        $cond: [
          { $eq: ["$gpxTimestamp", null] },
          "لا يوجد",
          { $year: "$gpxTimestamp" }
        ]
      }
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

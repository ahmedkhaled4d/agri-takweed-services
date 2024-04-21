import { PipelineStage } from "mongoose";

export const initailGetAgg = ({
  filter,
  skip,
  limit
}: {
  filter: Record<string, unknown>;
  skip: number;
  limit: number;
}): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $lookup: {
      from: "locations",
      localField: "farm.location.governorate",
      foreignField: "_id",
      as: "governorate"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "farm.location.center",
      foreignField: "_id",
      as: "center"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "farm.location.hamlet",
      foreignField: "_id",
      as: "hamlet"
    }
  },
  {
    $lookup: {
      from: "crops",
      localField: "crop",
      foreignField: "_id",
      as: "cropDetails"
    }
  },
  { $unwind: "$governorate" },
  { $unwind: "$center" },
  { $unwind: "$hamlet" },
  { $unwind: "$cropDetails" },
  {
    $project: {
      "farm.location": 0,
      crop: 0,
      user: 0,
      createdBy: 0,
      "cropDetails.varieties": 0,
      "governorate.type": 0,
      "governorate.parent": 0,
      "governorate.coordinates": 0,
      "center.type": 0,
      "center.parent": 0,
      "center.coordinates": 0,
      "hamlet.type": 0,
      "hamlet.parent": 0,
      "hamlet.coordinates": 0
    }
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

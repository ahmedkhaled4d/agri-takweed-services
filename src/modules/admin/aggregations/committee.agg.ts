import { PipelineStage } from "mongoose";

export const getCommitteeUsersCountAgg = (
  toDate: Date,
  fromDate: Date
): Array<PipelineStage> => [
  {
    $match: {
      committeeDate: {
        $lt: toDate,
        $gte: fromDate
      }
    }
  },
  {
    $facet: {
      hagrUsers: [
        {
          $group: {
            _id: "$hagrUser",
            hagrUsers: { $sum: 1 },
            farmsCount: { $sum: { $size: "$farms" } }
          }
        },
        {
          $project: { count: "$hagrUsers", type: "hagr", farms: "$farmsCount" }
        }
      ],
      mahaseelUsers: [
        {
          $group: {
            _id: "$mahaseelUser",
            mahaseelUsers: { $sum: 1 },
            farmsCount: { $sum: { $size: "$farms" } }
          }
        },
        {
          $project: {
            count: "$mahaseelUsers",
            type: "mahaseel",
            farms: "$farmsCount"
          }
        }
      ]
    }
  },
  { $project: { user: { $setUnion: ["$mahaseelUsers", "$hagrUsers"] } } },
  { $unwind: "$user" },
  { $replaceRoot: { newRoot: "$user" } },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "userData"
    }
  },
  { $unwind: { path: "$userData" } },
  {
    $project: {
      _id: 1,
      count: 1,
      name: "$userData.name",
      phone: "$userData.phone",
      type: 1,
      farmsCount: "$farms"
    }
  }
];

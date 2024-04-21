import { PipelineStage } from "mongoose";

export const requestTraceabilityGeneral = (
  season: number
): Array<PipelineStage> => [
  {
    $addFields: {
      season: {
        $year: "$requestData.gpxTimestamp"
      }
    }
  },
  {
    $match: {
      season: season
    }
  },
  {
    $unwind: {
      path: "$history"
    }
  },
  {
    $unwind: {
      path: "$history.payload"
    }
  },
  {
    $project: {
      variety: "$history.payload.variety",
      amount: "$history.payload.amount",
      name: "$requestData.farm.name",
      ownerName: "$requestData.farm.owner",
      ownerPhone: "$requestData.farm.phone",
      code: 1,
      from: "$history.from",
      to: "$history.to",
      transactionType: "$history.transactionType",
      createdAt: "$history.createdAt",
      initialAmount: {
        $filter: {
          input: "$charge",
          as: "chr",
          cond: {
            $eq: ["$history.payload.variety", "$$chr.variety"]
          }
        }
      }
    }
  },
  {
    $match: {
      to: { $ne: null }
    }
  },
  {
    $unwind: {
      path: "$initialAmount"
    }
  },
  {
    $group: {
      _id: { code: "$code", variety: "$variety", to: "$to" },
      amount: {
        $sum: "$amount"
      },
      initialAmount: { $first: "$initialAmount.initialAmount" },
      variety: { $first: "$variety" },
      name: { $first: "$name" },
      ownerName: { $first: "$name" },
      ownerPhone: { $first: "$ownerPhone" },
      code: { $first: "$code" },
      from: { $first: "$from" },
      to: { $first: "$to" },
      transactionType: { $first: "$transactionType" },
      createdAt: { $first: "$createdAt" }
    }
  },
  {
    $lookup: {
      from: "hubs",
      localField: "to",
      foreignField: "_id",
      as: "to"
    }
  },
  {
    $unwind: { path: "$to" }
  },
  {
    $project: {
      variety: 1,
      amount: 1,
      farmName: "$name",
      ownerName: 1,
      ownerPhone: 1,
      code: 1,
      from: 1,
      hubType: "$to.type",
      hubSubType: "$to.subType",
      hubName: "$to.hubName",
      hubCode: "$to.hubCode",
      hubGov: "$to.location.governorate",
      hubCenter: "$to.location.center",
      hubHamlet: "$to.location.hamlet",
      initialAmount: 1,
      transactionType: 1,
      transactionDate: "$createdAt"
    }
  },
  { $sort: { transactionDate: -1 } }
];

import { PipelineStage } from "mongoose";

export interface getRequestTraceByCodeAggResult {
  // from: string;
  // to: string;
  historyId: string;
  variety: string;
  amount: number;
  // farmName: string;
  // ownerName: string;
  // ownerPhone: string;
  // code: string;
  toHubName: string;
  // toHubType: string;
  // toHubSubType: string;
  // toHubCode: string;
  // toHubGov: string;
  // toHubCenter: string;
  // toHubHamlet: string;
  fromHubName?: string;
  // fromHubType?: string;
  // fromHubSubType?: string;
  // fromHubCode?: string;
  // fromHubGov?: string;
  // fromHubCenter?: string;
  // fromHubHamlet?: string;
  // initialAmount: number;
  transactionType: number;
  transactionDate: Date;
}

export const getRequestTraceByCodeAgg = (
  code: string
): Array<PipelineStage> => [
  {
    $match: {
      code: code
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
      historyId: "$history._id",
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
    $lookup: {
      from: "hubs",
      localField: "from",
      foreignField: "_id",
      as: "from"
    }
  },
  {
    $unwind: { path: "$from", preserveNullAndEmptyArrays: true }
  },
  {
    $project: {
      _id: 0,
      // code: 1,
      // from: {
      //   $ifNull: ["$from._id", null]
      // },
      // to: "$to._id",
      historyId: 1,
      variety: 1,
      amount: 1,
      // initialAmount: "$initialAmount.initialAmount",
      // farmName: "$name",
      // ownerName: 1,
      // ownerPhone: 1,
      toHubName: "$to.hubName",
      // toHubType: "$to.type",
      // toHubSubType: "$to.subType",
      // toHubCode: "$to.hubCode",
      // toHubGov: "$to.location.governorate",
      // toHubCenter: "$to.location.center",
      // toHubHamlet: "$to.location.hamlet",
      fromHubName: "$from.hubName",
      // fromHubType: "$from.type",
      // fromHubSubType: "$from.subType",
      // fromHubCode: "$from.hubCode",
      // fromHubGov: "$from.location.governorate",
      // fromHubCenter: "$from.location.center",
      // fromHubHamlet: "$from.location.hamlet",
      transactionType: 1,
      transactionDate: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      }
    }
  },
  { $sort: { transactionDate: -1 } }
];

export const RequestTraceabilityOneReportForTreeAgg = (
  code: string
): Array<PipelineStage> => [
  {
    $match: {
      code: code
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
  // Get the total sum of the variety.
  {
    $group: {
      _id: { variety: "$variety", to: "$to", from: "$from" },
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
  // Then group the varieties.
  {
    $group: {
      _id: { to: "$to", from: "$from" },
      varieties: {
        $addToSet: {
          variety: "$variety",
          amount: "$amount",
          initialAmount: "$initialAmount",
          transactionDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          }
        }
      },
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
    $lookup: {
      from: "hubs",
      localField: "from",
      foreignField: "_id",

      as: "from"
    }
  },
  {
    $unwind: { path: "$from", preserveNullAndEmptyArrays: true }
  },
  {
    $project: {
      _id: 0,
      from: { $ifNull: ["$_id.from", "$code"] },
      to: "$_id.to",
      varieties: 1,
      farmName: "$name",
      ownerName: 1,
      ownerPhone: 1,
      code: 1,
      toHubType: "$to.type",
      toHubSubType: "$to.subType",
      toHubName: "$to.hubName",
      toHubCode: "$to.hubCode",
      toHubGov: "$to.location.governorate",
      toHubCenter: "$to.location.center",
      toHubHamlet: "$to.location.hamlet",
      toHubCooredinate: "$to.location.cooredinate",
      fromHubType: "$from.type",
      fromHubSubType: "$from.subType",
      fromHubName: "$from.hubName",
      fromHubCode: "$from.hubCode",
      fromHubGov: "$from.location.governorate",
      fromHubCenter: "$from.location.center",
      fromHubHamlet: "$from.location.hamlet",
      fromHubCooredinate: "$from.location.cooredinate",
      transactionType: 1
    }
  },
  { $sort: { transactionDate: -1 } }
];

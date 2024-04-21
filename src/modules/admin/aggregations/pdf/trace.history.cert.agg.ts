import type { Types, PipelineStage } from "mongoose";

export const getHistoryUsingCodeAndIdForPdfAgg = (
  code: string,
  id: Types.ObjectId
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
    $match: {
      "history._id": id
    }
  },
  {
    $lookup: {
      from: "hubs",
      localField: "history.to",
      foreignField: "_id",
      as: "to"
    }
  },
  {
    $lookup: {
      from: "hubs",
      localField: "history.from",
      foreignField: "_id",
      as: "from"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "history.user",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $lookup: {
      from: "crops",
      localField: "requestData.crop",
      foreignField: "_id",
      as: "crop"
    }
  },
  {
    $unwind: {
      path: "$to"
    }
  },
  {
    $unwind: {
      path: "$from",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $unwind: {
      path: "$user"
    }
  },
  {
    $unwind: {
      path: "$crop"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "to.location.governorate",
      foreignField: "_id",
      as: "toGov"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "to.location.center",
      foreignField: "_id",
      as: "toCenter"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "to.location.hamlet",
      foreignField: "_id",
      as: "toHamlet"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "from.location.governorate",
      foreignField: "_id",
      as: "fromGov"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "from.location.center",
      foreignField: "_id",
      as: "fromCenter"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "from.location.hamlet",
      foreignField: "_id",
      as: "fromHamlet"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "requestData.farm.location.hamlet",
      foreignField: "_id",
      as: "farmLoc.hamlet"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "requestData.farm.location.center",
      foreignField: "_id",
      as: "farmLoc.center"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "requestData.farm.location.governorate",
      foreignField: "_id",
      as: "farmLoc.governorate"
    }
  },
  {
    $unwind: {
      path: "$farmLoc.hamlet"
    }
  },
  {
    $unwind: {
      path: "$farmLoc.center"
    }
  },
  {
    $unwind: {
      path: "$farmLoc.governorate"
    }
  },
  {
    $project: {
      _id: 0,
      code: 1,
      historyId: "$history._id",
      farmName: "$requestData.farm.name",
      farmOwner: {
        name: "$requestData.farm.owner",
        phone: "$requestData.farm.phone"
      },
      farmLoc: {
        governorate: "$farmLoc.governorate.name_ar",
        center: "$farmLoc.center.name_ar",
        hamlet: "$farmLoc.hamlet.name_ar"
      },
      season: {
        $year: "$requestData.gpxTimestamp"
      },
      transactionType: "$history.transactionType",
      transactionDate: "$history.createdAt",
      variety: "$history.payload.variety",
      amount: "$history.payload.amount",
      cropName: "$crop.name_ar",
      to: {
        owner: {
          $cond: {
            if: {
              $in: ["owner", "$to.contacts.type"]
            },
            then: {
              $arrayElemAt: [
                "$to.contacts",
                {
                  $indexOfArray: ["$to.contacts.type", "owner"]
                }
              ]
            },
            else: {
              $arrayElemAt: ["$to.contacts", 0]
            }
          }
        },
        name: "$to.hubName",
        code: "$to.hubCode",
        type: "$to.type",
        subType: "$to.subType",
        ownerType: {
          $ifNull: ["$to.ownerType", "unknown"]
        },
        gov: "$toGov.name_ar",
        center: "$toCenter.name_ar",
        hamlet: "$toHamlet.name_ar"
      },
      from: {
        $cond: [
          {
            $eq: [
              {
                $type: "$from"
              },
              "missing"
            ]
          },
          null,
          {
            owner: {
              $cond: {
                if: {
                  $in: ["owner", "$from.contacts.type"]
                },
                then: {
                  $arrayElemAt: [
                    "$from.contacts",
                    {
                      $indexOfArray: ["$from.contacts.type", "owner"]
                    }
                  ]
                },
                else: {
                  $arrayElemAt: ["$from.contacts", 0]
                }
              }
            },
            name: "$from.hubName",
            code: "$from.hubCode",
            type: "$from.type",
            subType: "$from.subType",
            ownerType: "$from.ownerType",
            gov: "$fromGov.name_ar",
            center: "$fromCenter.name_ar",
            hamlet: "$fromHamlet.name_ar"
          }
        ]
      }
    }
  }
];

export interface HistoryDataForPdf {
  code: string;
  historyId: string;
  farmName: string;
  farmOwner: {
    name: string;
    phone: string;
  };
  cropName: string;
  season: number;
  transactionType: string;
  transactionDate: string;
  variety: string;
  amount: number;
  farmLoc: {
    governorate: string;
    center: string;
    hamlet: string;
  };
  to: {
    owner: {
      name: string;
      phone: string;
      email?: string;
      type: string;
      _id: string;
    };
    name: string;
    code: string;
    type: string;
    subType: string;
    ownerType: string;
    gov: string;
    center: string;
    hamlet: string;
  };
  from?: {
    owner: {
      name: string;
      phone: string;
      type: string;
      _id: string;
    };
    name: string;
    code: string;
    type: string;
    subType: string;
    ownerType: string;
    gov: string;
    center: string;
    hamlet: string;
  };
}

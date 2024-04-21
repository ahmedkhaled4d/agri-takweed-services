import mongoose from "mongoose";
import { PipelineStage } from "mongoose";

export const visitsReport = (
  startDate: Date,
  endDate: Date,
  season: Array<number>,
  crops: Array<mongoose.Types.ObjectId>,
  governorates: Array<mongoose.Types.ObjectId>
): Array<PipelineStage> => [
  {
    $project: {
      RequestedTotalArea: {
        $sum: "$varieties.area.value"
        // In case of string (Old ones had string inputed in value)
        // $sum: {
        //            $map: {
        //                input: "$varieties.area.value",
        //                as: "strArea",
        //                in: {
        //                    $cond: [
        //                        { $isNumber: "$$strArea" },
        //                        "$$strArea", { $convert: { input: "$$strArea", to: "double" } }
        //                    ]
        //
        //                }
        //            }
        //        }
      },
      NoOfLands: {
        $size: {
          $ifNull: ["$gpx", []]
        }
      },
      ActualTotalArea: "$totalArea",
      farm: 1,
      crop: 1,
      user: 1,
      gpx: 1,
      status: 1,
      code: 1,
      governorate: "$farm.location.governorate",
      season: {
        $year: "$gpxTimestamp"
      },
      year: {
        $year: "$createdAt"
      },
      month: {
        $month: "$createdAt"
      },
      day: {
        $dayOfMonth: "$createdAt"
      },
      createdAt: 1,
      gpxTimestamp: 1,
      checkDate: {
        $cond: {
          if: "$gpxOriginalDate",
          then: "$gpxOriginalDate",
          else: "$gpxTimestamp"
        }
      },
      gpxYear: {
        $cond: {
          if: "$gpxOriginalDate",
          then: {
            $year: "$gpxOriginalDate"
          },
          else: {
            $year: "$gpxTimestamp"
          }
        }
      },
      gpxMonth: {
        $cond: {
          if: "$gpxOriginalDate",
          then: {
            $month: "$gpxOriginalDate"
          },
          else: {
            $month: "$gpxTimestamp"
          }
        }
      },
      gpxDay: {
        $cond: {
          if: "$gpxOriginalDate",
          then: {
            $dayOfMonth: "$gpxOriginalDate"
          },
          else: {
            $dayOfMonth: "$gpxTimestamp"
          }
        }
      },
      size_of_gpx: {
        $size: {
          $ifNull: ["$gpx", []]
        }
      }
    }
  },
  {
    $match: {
      size_of_gpx: {
        $gt: 0
      },
      crop: {
        $in: crops
      },
      checkDate: {
        $lt: new Date(endDate),
        $gt: new Date(startDate)
      },
      season: {
        $in: season
      },
      governorate: {
        $in: governorates
      }
    }
  },
  {
    $unwind: {
      path: "$gpx"
    }
  },
  {
    $unwind: {
      path: "$gpx.points"
    }
  },
  {
    $group: {
      _id: "$code",
      NoOfPoints: {
        $sum: 1
      },
      user: {
        $first: "$user"
      },
      crop: {
        $first: "$crop"
      },
      gpx: {
        $first: "$gpx"
      },
      farm: {
        $first: "$farm"
      },
      RequestedTotalArea: {
        $first: "$RequestedTotalArea"
      },
      NoOfLands: {
        $first: "$NoOfLands"
      },
      ActualTotalArea: {
        $first: "$ActualTotalArea"
      },
      status: {
        $first: "$status"
      },
      year: {
        $first: "$year"
      },
      month: {
        $first: "$month"
      },
      day: {
        $first: "$day"
      },
      createdAt: {
        $first: "$createdAt"
      },
      gpxTimestamp: {
        $first: "$gpxTimestamp"
      },
      gpxYear: {
        $first: "$gpxYear"
      },
      gpxMonth: {
        $first: "$gpxMonth"
      },
      gpxDay: {
        $first: "$gpxDay"
      }
    }
  },
  {
    $lookup: {
      from: "crops",
      localField: "crop",
      foreignField: "_id",
      as: "crop"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user"
    }
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
      localField: "farm.location.hamlet",
      foreignField: "_id",
      as: "hamlet"
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
    $unwind: {
      path: "$user"
    }
  },
  {
    $unwind: {
      path: "$governorate"
    }
  },
  {
    $unwind: {
      path: "$hamlet"
    }
  },
  {
    $unwind: {
      path: "$center"
    }
  },
  {
    $unwind: {
      path: "$crop"
    }
  },
  {
    $project: {
      code: "$_id",
      _id: 0,
      farmOwner: "$farm.owner",
      farmName: "$farm.name",
      createdAt: 1,
      coordinate: {
        $concat: [
          {
            $toString: "$gpx.points.lat"
          },
          ",",
          {
            $toString: "$gpx.points.lng"
          }
        ]
      },
      lat: {
        $toString: "$gpx.points.lat"
      },
      lng: {
        $toString: "$gpx.points.lng"
      },
      farmOwnerPhone: "$farm.phone",
      user: "$user.name",
      userPhone: "$user.phone",
      governorate: "$governorate.name_ar",
      hamlet: "$hamlet.name_ar",
      center: "$center.name_ar",
      RequestedTotalArea: 1,
      NoOfLands: 1,
      ActualTotalArea: 1,
      NOPointsAfterSubtraction: {
        $subtract: ["$NoOfPoints", "$NoOfLands"]
      },
      RequestDate: {
        $concat: [
          {
            $toString: "$day"
          },
          "-",
          {
            $toString: "$month"
          },
          "-",
          {
            $toString: "$year"
          }
        ]
      },
      gpxDate: {
        $concat: [
          {
            $toString: "$gpxDay"
          },
          "-",
          {
            $toString: "$gpxMonth"
          },
          "-",
          {
            $toString: "$gpxYear"
          }
        ]
      },
      status: 1
    }
  },
  {
    $sort: {
      createdAt: -1
    }
  }
];

export const pointsReport = (
  startDate: Date,
  endDate: Date,
  season: number[],
  crops: mongoose.Types.ObjectId[],
  governorates: mongoose.Types.ObjectId[]
): Array<PipelineStage> => [
  {
    $project: {
      size_of_gpx: {
        $size: {
          $ifNull: ["$gpx", []]
        }
      },
      size_of_gpx_condition: {
        $gt: [
          {
            $size: {
              $ifNull: ["$gpx", []]
            }
          },
          0
        ]
      },
      code: 1,
      farmName: "$farm.name",
      createdAt: 1,
      updatedAt: 1,
      governorate: "$farm.location.governorate",
      gpx: 1,
      crop: 1,
      season: {
        $year: "$gpxTimestamp"
      },
      visitsNumber: 1
    }
  },
  {
    $match: {
      size_of_gpx_condition: {
        $eq: true
      },
      crop: {
        $in: crops
      },
      season: {
        $in: season
      },
      governorate: {
        $in: governorates
      },
      updatedAt: {
        $lt: new Date(endDate),
        $gt: new Date(startDate)
      }
    }
  },
  {
    $project: {
      code: 1,
      farmName: "$farmName",
      createdAt: 1,
      updatedAt: {
        $substr: ["$updatedAt", 0, 10]
      },
      gpx: 1,
      visitsNumber: {
        $cond: {
          if: "$visitsNumber",
          then: "$visitsNumber",
          else: 0
        }
      }
    }
  },
  {
    $sort: {
      updatedAt: -1
    }
  }
];

// ---- Intersections Report

export const intersectionsReport = (
  startDate: Date,
  endDate: Date,
  season: number[],
  crops: mongoose.Types.ObjectId[],
  governorates: mongoose.Types.ObjectId[]
) => {
  return [
    {
      $project: {
        crop: "$polygons.crop",
        code: "$polygons.code",
        gpxDate: "$polygons.gpxDate",
        farmName: "$polygons.farmName",
        owner: "$polygons.owner",
        point: "$polygons.point",
        intersections: "$polygons.intersections",
        sizeofIntersections: {
          $size: { $ifNull: ["$polygons.intersections", []] }
        },
        area: "$polygons.area"
      }
    },
    {
      $match: {
        sizeofIntersections: {
          $gt: 0
        }
      }
    },
    {
      $unwind: {
        path: "$intersections"
      }
    },
    {
      $lookup: {
        from: "requests",
        localField: "code",
        foreignField: "code",
        as: "request"
      }
    },
    {
      $lookup: {
        from: "requests",
        localField: "intersections.landIntersectsWith",
        foreignField: "code",
        as: "IntersectedRequest"
      }
    },
    {
      $unwind: {
        path: "$request"
      }
    },
    {
      $unwind: {
        path: "$IntersectedRequest"
      }
    },
    {
      $project: {
        originalCode: "$code",
        originalFarmName: "$farmName",
        originalPiece: "$point",
        netArea: {
          $round: [
            {
              $subtract: ["$area", "$intersections.areaOfIntersection"]
            },
            2
          ]
        },
        requestedCrop: "$request.crop",
        governorate: "$request.farm.location.governorate",
        intersectedCrop: "$IntersectedRequest.crop",
        intersectedFarmName: "$IntersectedRequest.farm.name",
        intersectedCode: "$intersections.landIntersectsWith",
        intersectedPiece: "$intersections.pieceIntersected",
        area: "$area",
        areaOfIntersection: "$intersections.areaOfIntersection",
        requestedSeason: {
          $year: "$request.gpxTimestamp"
        },
        gpxDate: "$gpxDate",
        intersectedSeason: {
          $year: "$IntersectedRequest.gpxTimestamp"
        },
        typeOfIntersection: {
          $cond: [
            {
              $eq: ["$area", "$intersections.areaOfIntersection"]
            },
            "Overlay",
            "Overlap"
          ]
        }
      }
    },
    {
      $match: {
        $expr: {
          $eq: ["$intersectedSeason", "$requestedSeason"]
        }
      }
    },
    {
      $match: {
        gpxDate: {
          $lt: new Date(endDate),
          $gt: new Date(startDate)
        },
        requestedCrop: {
          $in: crops
        },
        governorate: {
          $in: governorates
        },
        intersectedCrop: {
          $in: crops
        },
        requestedSeason: {
          $in: season
        },
        intersectedSeason: {
          $in: season
        }
      }
    },
    {
      $project: {
        originalCode: 1,
        originalFarmName: 1,
        originalPiece: 1,
        intersectedFarmName: 1,
        intersectedCode: 1,
        intersectedPiece: 1,
        netArea: 1,
        area: 1,
        areaOfIntersection: 1,
        typeOfIntersection: 1
      }
    }
  ];
};

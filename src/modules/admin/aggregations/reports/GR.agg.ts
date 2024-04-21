import { PipelineStage, Types } from "mongoose";

export const generalReport = (
  startDate: Date,
  endDate: Date,
  season: number[],
  crops: Types.ObjectId[],
  governorates: Types.ObjectId[]
): Array<PipelineStage> => [
  {
    $addFields: {
      Myseason: {
        $year: "$gpxTimestamp"
      }
    }
  },
  {
    $match: {
      crop: {
        $in: crops
      },
      "farm.location.governorate": {
        $in: governorates
      },
      createdAt: {
        // startDate
        $gt: new Date(startDate),
        // end Date
        $lt: new Date(endDate)
      },
      Myseason: {
        $in: season
      }
    }
  },
  {
    $project: {
      RequestedTotalArea: {
        $sum: "$varieties.area.value"
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
    $match: {
      NoOfPoints: {
        $gt: 1
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
      cropName: "$crop.name_ar",
      cropID: "$crop._id",
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
      gpxYear: 1,
      gpxTimestamp: 1,
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
      status: 1,
      Myseason: {
        $year: "$gpxTimestamp"
      }
    }
  },
  {
    $sort: {
      createdAt: -1
    }
  }
];

import type { PipelineStage, Types } from "mongoose";

export const reportShamalKolo = (
  startDate: string,
  endDate: string,
  seasons: number[],
  crops: Types.ObjectId[],
  governorates: Types.ObjectId[]
): Array<PipelineStage> => [
  {
    $addFields: {
      season: {
        $year: "$gpxTimestamp"
      },
      NoOfLands: {
        $size: {
          $ifNull: ["$gpx", []]
        }
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
      season: {
        $in: seasons
      },
      createdAt: {
        // end Date
        $lt: new Date(endDate),
        // startDate
        $gt: new Date(startDate)
      },
      NoOfLands: {
        $gt: 0
      }
    }
  },

  // Need to group by GPX variety.
  { $unwind: "$gpx" },
  {
    $addFields: {
      variety: "$gpx.variety"
    }
  },
  {
    $group: {
      _id: { code: "$code", variety: "$gpx.variety" },
      plot: { $addToSet: "$gpx.name_ar" },
      NoOfLands: { $sum: 1 },
      actualArea: { $sum: "$gpx.area" },
      totalArea: { $first: "$totalArea" },
      farm: { $first: "$farm" },
      crop: { $first: "$crop" },
      gpxTimestamp: { $first: "$gpxTimestamp" },
      gpxOriginalDate: { $first: "$gpxOriginalDate" },
      varieties: { $first: "$varieties" },
      season: { $first: "$season" },
      createdAt: { $first: "$createdAt" },
      mahaseelEngineer: { $first: "$mahaseelEngineer" },
      plantQuarantineEngineer: { $first: "$plantQuarantineEngineer" },
      sampleNumber: { $first: "$sampleNumber" },
      visitDetails: { $first: "$visitDetails" },
      dayOfWeek: { $first: "$dayOfWeek" },
      inspectionDate: { $first: "$inspectionDate" }
    }
  },
  {
    $addFields: {
      // concat all plot names in one string with - separator
      item: {
        plot: {
          $reduce: {
            input: "$plot",
            initialValue: "",
            in: {
              $concat: [
                "$$value",
                { $cond: [{ $eq: ["$$value", ""] }, "", "-"] },
                "$$this"
              ]
            }
          }
        },
        variety: "$_id.variety",
        actualArea: "$actualArea"
      }
    }
  },
  // Group by code
  {
    $group: {
      _id: "$_id.code",
      NoOfLands: { $first: "$NoOfLands" },
      totalArea: { $first: "$totalArea" },
      farm: { $first: "$farm" },
      crop: { $first: "$crop" },
      gpxTimestamp: { $first: "$gpxTimestamp" },
      gpxOriginalDate: { $first: "$gpxOriginalDate" },
      varieties: { $first: "$varieties" },
      season: { $first: "$season" },
      createdAt: { $first: "$createdAt" },
      mahaseelEngineer: { $first: "$mahaseelEngineer" },
      plantQuarantineEngineer: { $first: "$plantQuarantineEngineer" },
      sampleNumber: { $first: "$sampleNumber" },
      visitDetails: { $first: "$visitDetails" },
      dayOfWeek: { $first: "$dayOfWeek" },
      inspectionDate: { $first: "$inspectionDate" },
      items: { $addToSet: "$item" }
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
  // Don't need to unwind because that will force us to group by code again
  {
    $lookup: {
      from: "geometries",
      localField: "_id",
      foreignField: "polygons.code",
      as: "geometry"
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
  // Sort by date
  { $sort: { createdAt: -1 } },
  {
    $project: {
      _id: 0,
      day: { $ifNull: ["$dayOfWeek", "لا يوجد"] },
      date: { $ifNull: ["$inspectionDate", "لا يوجد"] },
      mahaseelEngineer: { $ifNull: ["$mahaseelEngineer", "لا يوجد"] },
      plantQuarantineEngineer: {
        $ifNull: ["$plantQuarantineEngineer", "لا يوجد"]
      },
      visitDetails: { $ifNull: ["$visitDetails", "لا يوجد"] },
      sampleNumber: { $ifNull: ["$sampleNumber", "لا يوجد"] },
      code: "$_id",
      farmName: "$farm.name",
      owner: "$farm.owner",
      ownerPhone: "$farm.phone",
      representative: { $ifNull: ["$farm.representative", "لا يوجد"] },
      representativePhone: {
        $ifNull: ["$farm.representativePhone", "لا يوجد"]
      },
      governorate: "$governorate.name_ar",
      center: "$center.name_ar",
      hamlet: "$hamlet.name_ar",
      crop: "$crop.name_ar",
      // Get center point of first GPX Points Array aka first Plot of land.
      centerPoint: {
        $let: {
          // our vars, the sum of all x and y coordinates and the size of the array
          vars: {
            sum: {
              $reduce: {
                input: {
                  $arrayElemAt: [
                    { $arrayElemAt: ["$geometry.polygons.coordinates", 0] },
                    0
                  ]
                },
                initialValue: { x: 0, y: 0 },
                in: {
                  x: { $sum: ["$$value.x", { $arrayElemAt: ["$$this", 0] }] },
                  y: { $sum: ["$$value.y", { $arrayElemAt: ["$$this", 1] }] }
                }
              }
            },
            size: {
              $size: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      { $arrayElemAt: ["$geometry.polygons.coordinates", 0] },
                      0
                    ]
                  },
                  [1] // prevent division by zero
                ]
              }
            }
          },
          in: {
            // calculate the average x and y coordinates
            // Not very accurate but good enough for our purposes
            x: {
              $divide: ["$$sum.x", "$$size"]
            },
            y: {
              $divide: ["$$sum.y", "$$size"]
            }
          }
        }
      },
      season: "$season",
      NoOfLands: 1,
      // Get all varieties names and areas spread them out in arrays
      requestVarieties: { $map: { input: "$varieties", in: "$$this.name" } },
      requestVarietiesArea: {
        $map: { input: "$varieties", in: "$$this.area.value" }
      },
      requestTotalArea: {
        $sum: "$varieties.area.value"
      },
      plots: { $map: { input: "$items", in: "$$this.plot" } },
      actualVarieties: { $map: { input: "$items", in: "$$this.variety" } },
      actualVarietiesArea: {
        $map: { input: "$items", in: "$$this.actualArea" }
      },
      actualTotalArea: "$totalArea",
      intersections: {
        $map: {
          input: "$geometry",
          as: "geo",
          in: {
            $reduce: {
              input: "$$geo.polygons.intersections",
              initialValue: {
                hasIntersections: 0,
                intersections: []
              },
              in: {
                $cond: [
                  {
                    $gt: [{ $size: "$$geo.polygons.intersections" }, 0]
                  }, // if
                  {
                    hasIntersections: {
                      $sum: [
                        "$$value.hasIntersections",
                        {
                          $size: "$$geo.polygons.intersections"
                        }
                      ]
                    },
                    intersections: {
                      $concatArrays: [
                        "$$value.intersections",
                        [
                          {
                            code: "$$this.landIntersectsWith",
                            area: "$$this.areaOfIntersection"
                          }
                        ]
                      ]
                    }
                  }, // then
                  {
                    /* don't do anything */
                  }
                ]
              }
            }
          }
        }
      }
    }
  },
  {
    $addFields: {
      intersections: {
        // Shape of intersections array is: [
        // {
        //  hasIntersections: 1,
        //  intersections: [
        //  { code: "code", area: 0 },
        // }
        // ]
        // filter out hasIntersections = 0
        $filter: {
          input: "$intersections",
          as: "inter",
          cond: { $gt: ["$$inter.hasIntersections", 0] }
        }
      }
    }
  }
  // for debuging usage only.
  // { $limit: 20 }
  // { $sort: { hasIntersections: -1 } }
];

import { PipelineStage, Types } from "mongoose";

export const plotReportAggregation = (
  crops: Types.ObjectId[],
  startDate: string,
  endDate: string,
  seasons: number[],
  governorates: Types.ObjectId[]
): Array<PipelineStage> => [
  // Get the request creator info
  {
    $addFields: {
      season: {
        $year: "$gpxTimestamp"
      }
    }
  },
  {
    $match: {
      crop: {
        $in: crops
      },
      season: {
        $in: seasons
      },
      "farm.location.governorate": {
        $in: governorates
      },
      updatedAt: {
        $gt: new Date(startDate),
        $lt: new Date(endDate)
      }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "createdBy",
      foreignField: "_id",
      as: "createdBy"
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
    $lookup: {
      from: "geometries",
      localField: "code",
      foreignField: "polygons.code",
      as: "geometry"
    }
  },
  {
    $unwind: {
      path: "$createdBy"
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
  // Set the data we want to show/use
  {
    $project: {
      gpx: {
        $map: {
          input: "$gpx",
          as: "gpxExpand",
          in: {
            name_ar: { $concat: ["$code", "$$gpxExpand.name_ar"] },
            farmName: "$farm.name",
            ownerName: "$farm.owner",
            ownerPhone: "$farm.phone",
            applicantName: "$createdBy.name",
            applicantPhone: "$createdBy.phone",
            governorate: "$governorate.name_ar",
            hamlet: "$hamlet.name_ar",
            center: "$center.name_ar",
            createdAt: "$createdAt",
            gpxTimestamp: "$gpxTimestamp",
            variety: "$$gpxExpand.variety",
            pointsCount: { $size: "$$gpxExpand.points" },
            plotsCount: {
              $size: { $ifNull: ["$gpx", []] }
            },
            plotArea: "$$gpxExpand.area",
            requestArea: {
              $sum: "$varieties.area.value"
            },
            intersection: {
              // format intersections.
              $let: {
                vars: {
                  geometryIndex: {
                    // Get the point from geometry.
                    $ifNull: [
                      {
                        $indexOfArray: [
                          "$geometry.polygons.point",
                          "$$gpxExpand.name_ar"
                        ]
                      },
                      -1
                    ]
                  }
                },
                in: {
                  $let: {
                    vars: {
                      geometryElm: {
                        $arrayElemAt: ["$geometry", "$$geometryIndex"]
                      }
                    },
                    in: {
                      $cond: {
                        if: { $gte: ["$$geometryIndex", 0] },
                        then: {
                          $map: {
                            input: "$$geometryElm.polygons.intersections",
                            as: "intersections",
                            in: {
                              name_ar: {
                                $concat: [
                                  "$$intersections.landIntersectsWith",
                                  "$$intersections.pieceIntersected"
                                ]
                              },
                              areaOfIntersection:
                                "$$intersections.areaOfIntersection",
                              percentOfIntersections: {
                                $multiply: [
                                  {
                                    $divide: [
                                      "$$intersections.areaOfIntersection",
                                      "$$gpxExpand.area"
                                    ]
                                  },
                                  100
                                ]
                              }
                            }
                          }
                        },
                        else: null
                      }
                    }
                  }
                }
              }
            },
            actualTotalArea: "$totalArea",
            status: "$status",
            updatedAt: "$updatedAt"
          }
        }
      }
    }
  },
  {
    $unwind: { path: "$gpx" }
  },
  {
    $replaceRoot: { newRoot: "$gpx" }
  },
  { $sort: { updatedAt: -1 } }
];

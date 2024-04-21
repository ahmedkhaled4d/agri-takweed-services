import { Types, PipelineStage } from "mongoose";

export const getAllGeoPlotsWithIntersectionsAgg = ({
  crops,
  seasons,
  startDate,
  endDate,
  governorates
}: {
  crops: Types.ObjectId[];
  seasons: number[];
  startDate: string;
  endDate: string;
  governorates: Types.ObjectId[];
}): Array<PipelineStage> => [
  {
    $addFields: {
      season: {
        $year: "$gpxTimestamp"
      }
    }
  },
  {
    $match: {
      crop: { $in: crops },
      "farm.location.governorate": {
        $in: governorates
      },
      createdAt: {
        // startDate
        $gt: new Date(startDate),
        // end Date
        $lt: new Date(endDate)
      },
      season: { $in: seasons }
    }
  },
  // Get the request creator info
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
        // Loop over the gpx
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
            gpxTimestamp: {
              $cond: {
                if: "$gpxOriginalDate",
                then: "$gpxOriginalDate",
                else: "$gpxTimestamp"
              }
            },
            season: { $year: "$gpxTimestamp" },
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
                        // Get the geometry index
                        $arrayElemAt: ["$geometry", "$$geometryIndex"]
                      }
                    },
                    in: {
                      // If found then it has intersection, format it as we want
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
                                "$$intersections.areaOfIntersection"
                              // percentOfIntersections: {
                              //   $multiply: [
                              //     {
                              //       $divide: [
                              //         "$$intersections.areaOfIntersection",
                              //         "$$gpxExpand.area"
                              //       ]
                              //     },
                              //     100
                              //   ]
                              // }
                            }
                          } // Else there is nothing!
                        },
                        else: []
                      }
                    }
                  }
                }
              }
            },
            // geometryIndex: "$$REMOVE" // DEBUG
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

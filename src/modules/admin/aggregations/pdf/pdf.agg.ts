import { PipelineStage } from "mongoose";

export const tableDataAgg = (code: string): Array<PipelineStage> => [
  {
    $match: {
      code: code
    }
  },
  {
    $project: {
      farm: 1,
      totalArea: 1,
      gpx: 1
    }
  },
  {
    $unwind: {
      path: "$gpx"
    }
  },
  {
    $group: {
      _id: "$gpx.variety",
      totalVarietyArea: {
        $sum: "$gpx.area"
      },
      count: {
        $count: {}
      },
      gpx: {
        $first: "$gpx"
      },
      farm: {
        $first: "$farm"
      },
      totalArea: {
        $first: "$totalArea"
      }
    }
  }
];

export const interAggregate = (code: string): Array<PipelineStage> => [
  {
    $match: {
      "polygons.code": code
    }
  },
  {
    $project: {
      code: "$polygons.code",
      intersections: "$polygons.intersections",
      originalPiece: "$polygons.point",
      farmName: "$polygons.farmName"
    }
  },
  {
    $unwind: {
      path: "$intersections"
    }
  },
  {
    $project: {
      "intersections.originalPiece": "$originalPiece",
      "intersections.landIntersectsWith": "$intersections.landIntersectsWith",
      "intersections.areaOfIntersection": "$intersections.areaOfIntersection",
      "intersections.pieceIntersected": "$intersections.pieceIntersected",
      "intersections.intersectionCoords": "$intersections.intersectionCoords",
      code: 1,
      farmName: 1
    }
  },
  {
    $lookup: {
      from: "requests",
      localField: "code",
      foreignField: "code",
      as: "originalLand"
    }
  },
  {
    $unwind: {
      path: "$originalLand"
    }
  },
  {
    $lookup: {
      from: "requests",
      localField: "intersections.landIntersectsWith",
      foreignField: "code",
      as: "intersectedLand"
    }
  },
  {
    $unwind: {
      path: "$intersectedLand"
    }
  },
  {
    $addFields: {
      originalCrop: "$originalLand.crop",
      intersectedCrop: "$intersectedLand.crop",
      originalSeason: {
        $year: "$originalLand.gpxTimestamp"
      },
      intersectedSeason: {
        $year: "$intersectedLand.gpxTimestamp"
      },
      intersectedFarmName: "$intersectedLand.farm.name"
    }
  },
  {
    $redact: {
      $cond: [
        {
          $eq: ["$originalCrop", "$intersectedCrop"]
        },
        "$$KEEP",
        "$$PRUNE"
      ]
    }
  },
  {
    $redact: {
      $cond: [
        {
          $eq: ["$originalSeason", "$intersectedSeason"]
        },
        "$$KEEP",
        "$$PRUNE"
      ]
    }
  },
  {
    $project: {
      "intersections.farmName": "$intersectedFarmName",
      "intersections.areaOfIntersection": "$intersections.areaOfIntersection",
      "intersections.originalPiece": "$intersections.originalPiece",
      "intersections.landIntersectsWith": "$intersections.landIntersectsWith",
      "intersections.intersectionCoords": "$intersections.intersectionCoords",
      "intersections.pieceIntersected": "$intersections.pieceIntersected",
      code: 1,
      originalLand: 1,
      intersectedLand: 1,
      originalCrop: 1,
      originalSeason: 1,
      intersectedCrop: 1,
      intersectedSeason: 1,
      farmName: 1
    }
  },
  {
    $group: {
      _id: {
        originalCode: "$code",
        originalPiece: "$originalPiece",
        originalLand: "$originalLand"
      },
      lands: {
        $addToSet: "$intersectedLand"
      },
      intersectionsData: {
        $addToSet: "$intersections"
      },
      original: {
        $addToSet: "$originalLand"
      }
    }
  },
  {
    $project: {
      originalLand: "$_id.originalLand",
      code: "$_id.originalCode",
      intersections: "$_id.intersections",
      lands: 1,
      intersectionsData: 1,
      original: 1
    }
  },
  {
    $project: {
      lands: {
        $concatArrays: ["$original", "$lands"]
      },
      intersectionsData: 1,
      code: 1
    }
  }
];

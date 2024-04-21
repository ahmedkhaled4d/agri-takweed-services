import { PipelineStage } from "mongoose";

export const ChartData = (year: string): Array<PipelineStage> => [
  {
    $match: {
      createdAt: {
        $gt: new Date(`${year}-01-01`),
        $lt: new Date(`${year}-12-31`)
      }
    }
  },
  {
    $lookup: {
      from: "crops",
      localField: "crop",
      foreignField: "_id",
      as: "selectedCrop"
    }
  },
  {
    $unwind: {
      path: "$selectedCrop"
    }
  },
  {
    $group: {
      _id: "$selectedCrop",
      count: {
        $sum: 1
      }
    }
  },
  {
    $project: {
      "_id.name_ar": 1,
      "_id.code": 1,
      "_id.color": 1,
      count: 1
    }
  }
];

export const ReportStatus = (year: number): Array<PipelineStage> => [
  {
    $addFields: {
      year_document: {
        $year: "$createdAt"
      }
    }
  },
  {
    $match: {
      $expr: {
        $eq: ["$year_document", year]
      }
    }
  },
  {
    $project: {
      month: {
        $month: "$createdAt"
      },
      status: 1
    }
  },
  {
    $group: {
      _id: {
        status: "$status",
        month: "$month"
      },
      tf: {
        $sum: 1
      }
    }
  },
  {
    $group: {
      _id: {
        statusArr: "$_id.status"
      },
      arr: {
        $push: {
          x: "$_id.month",
          y: "$tf"
        }
      }
    }
  }
];

export const RequestCrops = (year: number): Array<PipelineStage> => [
  {
    $addFields: {
      year_document: {
        $year: "$createdAt"
      }
    }
  },
  {
    $match: {
      $expr: {
        $eq: ["$year_document", year]
      }
    }
  },
  {
    $project: {
      month: {
        $month: "$createdAt"
      },
      crop: 1
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
    $unwind: {
      path: "$crop"
    }
  },
  {
    $project: {
      month: 1,
      name: "$crop.name_ar",
      color: "$crop.color"
    }
  },
  {
    $group: {
      _id: {
        name: "$name",
        color: "$color",
        month: "$month"
      },
      tf: {
        $sum: 1
      }
    }
  },
  {
    $group: {
      _id: {
        name: "$_id.name",
        color: "$_id.color"
      },
      arr: {
        $push: {
          x: "$_id.month",
          y: "$tf"
        }
      }
    }
  }
];

export const CropsRequestById = (
  cropId: string | unknown
): Array<PipelineStage> => [
  {
    $match: {
      crop: cropId,
      status: "accept"
    }
  },
  {
    $sort: {
      createdAt: 1
    }
  },
  {
    $limit: 1000
  },
  {
    $project: {
      "farm.location.hamlet": 1
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
    $unwind: {
      path: "$hamlet"
    }
  },
  {
    $addFields: {
      CoorArr: []
    }
  },
  {
    $project: {
      name: "$hamlet.name_ar",
      coordinates: "$hamlet.coordinates",
      CoorArr: 1
    }
  },
  {
    $group: {
      _id: {
        name: "$name",
        s0: {
          $first: "$coordinates"
        },
        s1: {
          $last: "$coordinates"
        }
      }
    }
  }
];

export const LocationRequestsByGovId = (
  governorate: string | unknown
): Array<PipelineStage> => [
  {
    $match: {
      "farm.location.governorate": governorate,
      status: "accept"
    }
  },
  {
    $sort: {
      createdAt: 1
    }
  },
  {
    $limit: 1000
  },
  {
    $project: {
      "farm.location.hamlet": 1
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
    $unwind: {
      path: "$hamlet"
    }
  },
  {
    $addFields: {
      CoorArr: []
    }
  },
  {
    $project: {
      name: "$hamlet.name_ar",
      coordinates: "$hamlet.coordinates",
      CoorArr: 1
    }
  },
  {
    $group: {
      _id: {
        name: "$name",
        s0: {
          $first: "$coordinates"
        },
        s1: {
          $last: "$coordinates"
        }
      }
    }
  }
];

export const LocationRequestsBySeason = (
  season: number
): Array<PipelineStage> => [
  {
    $match: {
      status: "accept"
    }
  },
  {
    $sort: {
      createdAt: 1
    }
  },
  {
    $project: {
      points: "$gpx.points",
      name: { $first: "$gpx.name_ar" },
      season: {
        $year: "$gpxTimestamp"
      }
    }
  },
  {
    $unwind: {
      path: "$points"
    }
  },
  {
    $match: {
      season: season
    }
  },
  {
    $addFields: {
      CoorArr: []
    }
  },
  {
    $project: {
      name: 1,
      coordinates: { $arrayElemAt: ["$points", 0] },
      CoorArr: 1
    }
  },
  {
    $group: {
      _id: {
        name: "$name",
        s0: "$coordinates.lat",
        s1: "$coordinates.lng"
      }
    }
  }
];

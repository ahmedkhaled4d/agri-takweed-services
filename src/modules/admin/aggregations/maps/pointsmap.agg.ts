import { FilterQuery, PipelineStage } from "mongoose";

export const mapAggregation = (
  match: FilterQuery<unknown>,
  selectedCrops: unknown,
  selectedSeason: unknown
): Array<PipelineStage> => [
  {
    $match: match
  },
  {
    $project: {
      code: "$code",
      farmName: "$farm.name",
      farmOwner: "$farm.owner",
      farmPhone: "$farm.phone",
      farmLocation: "$farm.location",
      season: {
        $year: "$gpxTimestamp"
      },
      crop: "$crop",
      gpx: "$gpx",
      user: "$user",
      status: "$status",
      varieties: "$varieties",
      totalArea: "$totalArea"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "farmLocation.governorate",
      foreignField: "_id",
      as: "result"
    }
  },
  {
    $unwind: {
      path: "$result"
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
      code: "$code",
      farmName: "$farmName",
      farmLocation: "$farmLocation",
      farmOwner: "$farmOwner",
      farmPhone: "$farmPhone",
      season: "$season",
      cropid: "$crop._id",
      cropName: "$crop.name_ar",
      gpx: "$gpx",
      status: "$status",
      governorate: "$result._id",
      expectedArea: {
        $sum: "$varieties.area.value"
      },
      ActualArea: "$totalArea"
    }
  },
  {
    $unwind: {
      path: "$gpx"
    }
  },
  {
    $group: {
      _id: "$_id",
      gpx: {
        $first: "$gpx"
      },
      code: {
        $first: "$code"
      },
      farmName: {
        $first: "$farmName"
      },
      farmOwner: {
        $first: "$farmOwner"
      },
      farmPhone: {
        $first: "$farmPhone"
      },
      season: {
        $first: "$season"
      },
      cropName: {
        $first: "$cropName"
      },
      cropid: {
        $first: "$cropid"
      },
      farmLocation: {
        $first: "$farmLocation"
      }
    }
  },
  {
    $unwind: {
      path: "$gpx.points"
    }
  },
  {
    $group: {
      _id: "$_id",
      gpx: {
        $first: "$gpx.points"
      },
      code: {
        $first: "$code"
      },
      farmName: {
        $first: "$farmName"
      },
      farmLocation: {
        $first: "$farmLocation"
      },
      farmOwner: {
        $first: "$farmOwner"
      },
      farmPhone: {
        $first: "$farmPhone"
      },
      season: {
        $first: "$season"
      },
      cropName: {
        $first: "$cropName"
      },
      cropid: {
        $first: "$cropid"
      }
    }
  },
  {
    $match: {
      season: {
        $in: selectedSeason
      },
      cropid: {
        $in: selectedCrops
      }
    }
  },
  {
    $project: {
      code: "$code",
      cropid: "$cropid",
      point: "$gpx",
      farmLocation: "$farmLocation",
      farmName: "$farmName",
      farmOwner: "$farmOwner",
      farmPhone: "$farmPhone",
      season: "$season",
      cropName: "$cropName",
      status: "$status",
      expectedArea: "$expectedArea",
      ActualArea: "$ActualArea"
    }
  }
];

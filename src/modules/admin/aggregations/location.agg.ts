import { PipelineStage } from "mongoose";

export const searchHameltAgg = (
  filter: Record<string, Record<string, string | boolean>>
): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $project: {
      name_ar: 1,
      type: 1,
      governorate: {
        $cond: {
          if: {
            $eq: ["$type", "center"]
          },
          then: "$parent",
          else: null
        }
      },
      center: {
        $cond: {
          if: {
            $eq: ["$type", "hamlet"]
          },
          then: "$parent",
          else: null
        }
      }
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "governorate",
      foreignField: "_id",
      as: "governorateName"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "center",
      foreignField: "_id",
      as: "centerName"
    }
  },
  {
    $addFields: {
      govPath: {
        $first: "$governorateName"
      }
    }
  },
  {
    $addFields: {
      centerPath: {
        $first: "$centerName"
      }
    }
  },
  {
    $project: {
      name_ar: 1,
      governorate: "$govPath.name_ar",
      center: "$centerPath.name_ar",
      centerId: "$centerPath._id",
      centerName: 1,
      type: 1
    }
  },
  {
    $match: {
      type: "hamlet"
    }
  },
  {
    $addFields: {
      centerParent: {
        $first: "$centerName"
      }
    }
  },
  {
    $project: {
      name_ar: 1,
      center: 1,
      centerId: 1,
      govParent: "$centerParent.parent"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "govParent",
      foreignField: "_id",
      as: "governorate"
    }
  },
  {
    $addFields: {
      governDetails: {
        $first: "$governorate"
      }
    }
  },
  {
    $project: {
      governorate: "$governDetails.name_ar",
      govId: "$governDetails._id",
      centerId: 1,
      center: 1,
      hamlet: "$name_ar"
    }
  },
  {
    $sort: {
      governorate: 1
    }
  }
];

export const searchCenterAgg = (
  filter: Record<string, Record<string, string | boolean>>
): Array<PipelineStage> => [
  {
    $match: filter
  },
  {
    $project: {
      name_ar: 1,
      type: 1,
      governorate: {
        $cond: {
          if: {
            $eq: ["$type", "center"]
          },
          then: "$parent",
          else: null
        }
      },
      center: {
        $cond: {
          if: {
            $eq: ["$type", "hamlet"]
          },
          then: "$parent",
          else: null
        }
      }
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "governorate",
      foreignField: "_id",
      as: "governorateName"
    }
  },
  {
    $lookup: {
      from: "locations",
      localField: "center",
      foreignField: "_id",
      as: "centerName"
    }
  },
  {
    $addFields: {
      govPath: {
        $first: "$governorateName"
      }
    }
  },
  {
    $addFields: {
      centerPath: {
        $first: "$centerName"
      }
    }
  },
  {
    $match: {
      type: "center"
    }
  },
  {
    $project: {
      govId: "$govPath._id",
      governorate: "$govPath.name_ar",
      center: "$name_ar",
      hamlet: null
    }
  },
  {
    $sort: {
      governorate: 1
    }
  }
];

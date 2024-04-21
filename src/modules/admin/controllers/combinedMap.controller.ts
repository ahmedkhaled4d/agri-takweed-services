import { RequestModel } from "../../../models";
import { Request as ExpressRequest, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const filterMap = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      selectedCrops,
      selectedGovernorate,
      selectedSeason,
      selectedstatus
    } = req.body;

    // Transforming the selectedCrops and selectedGovernorate to ObjectIds
    for (let i = 0; i < selectedCrops.length; i++) {
      selectedCrops[i] = new mongoose.Types.ObjectId(selectedCrops[i]);
    }
    for (let i = 0; i < selectedGovernorate.length; i++) {
      selectedGovernorate[i] = new mongoose.Types.ObjectId(
        selectedGovernorate[i]
      );
    }
    if (
      !selectedCrops ||
      !selectedGovernorate ||
      !selectedSeason ||
      !selectedstatus
    ) {
      return res.status(400).json({
        message:
          "invalid body params , [selectedCrops , selectedGovernorate , selectedSeason , selectedstatus] "
      });
    }

    // Map Aggregation, this is an important and integral part of the system!
    const mapAggregation = [
      {
        $project: {
          code: "$code",
          farmName: "$farm.name",
          farmOwner: "$farm.owner",
          farmPhone: "$farm.phone",
          farmLocation: "$farm.location",
          season: {
            // Pre 2022 the date was string? but now it is date
            // So if error encountered during production, we can use the commented line, however currently it is working fine ???
            // I leave it here now for any poor soul who will have to deal with this in the future
            //  $year: { $dateFromString: { dateString: "$gpxTimestamp", onError: "$gpxTimestamp" } }
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
          farmLocation: "$farm.location",
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
      // Match should be the first stage in the pipeline ????
      {
        $match: {
          season: {
            $in: selectedSeason
          },
          governorate: {
            $in: selectedGovernorate
          },
          cropid: {
            $in: selectedCrops
          },
          status: {
            $in: selectedstatus
          }
        }
      },
      {
        $project: {
          code: "$code",
          farmName: "$farmName",
          farmOwner: "$farmOwner",
          farmPhone: "$farmPhone",
          season: "$season",
          cropName: "$cropName",
          gpx: "$gpx",
          status: "$status",
          expectedArea: "$expectedArea",
          ActualArea: "$ActualArea"
        }
      }
    ];

    const mapData = await RequestModel.aggregate(mapAggregation);

    return res.json(mapData);
  } catch (error) {
    next(error);
  }
};

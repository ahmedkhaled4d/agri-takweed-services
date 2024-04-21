import { NextFunction, Request, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import {
  CropDocument,
  CropModel,
  FarmModel,
  GeometryModel,
  RequestModel,
  LocationDocument
} from "../../../models";
import { getBucket } from "../../../services";
import { verifyCertificateIntersectionAgg } from "../aggregation";
import { HttpStatus } from "../../../assets/httpCodes";
import { isPositiveNumber } from "../../../utils";

const bucket = getBucket("gs://takweed-certificates");

export const verifyCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.code)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Missing Code in body!" });
    const intersections = await GeometryModel.aggregate(
      verifyCertificateIntersectionAgg(req.body.code)
    );
    const data = await RequestModel.aggregate([
      {
        $match: {
          code: req.body.code
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
          localField: "farm.location.center",
          foreignField: "_id",
          as: "center"
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
          path: "$governorate"
        }
      },
      {
        $unwind: {
          path: "$center"
        }
      },
      {
        $unwind: {
          path: "$hamlet"
        }
      },
      {
        $project: {
          code: 1,
          farmName: "$farm.name",
          owner: "$farm.owner",
          totalArea: 1,
          gpx: 1,
          governorate: "$governorate.name_ar",
          center: "$center.name_ar",
          hamlet: "$hamlet.name_ar"
        }
      }
    ]);
    return res.status(HttpStatus.OK).json({ data, intersections });
  } catch (error) {
    next(error);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.user.userId;
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = req.headers.limit ? parseInt(req.headers.limit.toString()) : 5;
    const skip = page * limit;
    limit = limit + skip;
    const filter = {
      user: new mongoose.Types.ObjectId(userId),
      cancelled: { $ne: true }
    };
    const aggregate: Array<PipelineStage> = [
      {
        $match: filter
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
          localField: "farm.location.center",
          foreignField: "_id",
          as: "center"
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
          from: "crops",
          localField: "crop",
          foreignField: "_id",
          as: "cropDetails"
        }
      },
      { $unwind: "$governorate" },
      { $unwind: "$center" },
      { $unwind: "$hamlet" },
      { $unwind: "$cropDetails" },
      {
        $project: {
          "farm.location": 0,
          crop: 0,
          user: 0,
          createdBy: 0,
          "cropDetails.varieties": 0,
          "governorate.type": 0,
          "governorate.parent": 0,
          "governorate.coordinates": 0,
          "center.type": 0,
          "center.parent": 0,
          "center.coordinates": 0,
          "hamlet.type": 0,
          "hamlet.parent": 0,
          "hamlet.coordinates": 0
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $limit: limit
      },
      {
        $skip: skip
      }
    ];
    const data = await RequestModel.aggregate(aggregate);
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

// create takweed request from client directly

// exports.Create = async (req: Request, res: Response, next: NextFunction) => {
//     try {

//     const userId = req.user.userId;
//     const {
//         farm , crop , varieties , quality
//     } = req.body
//     if(!farm  || !crop || !varieties || !quality) {
//         res.status(409).json({ message: 'Missing some paramters in your body' })
//     }
//     const farmObj = await Farm.findById(farm).populate('location.governorate');
//     const cropObj = await Crop.findById(crop);

//     // check resources
//     if(!farmObj) { res.status(409).json({ message: 'invalid farm id' })}
//     if(!cropObj) { res.status(409).json({ message: 'invalid Crop id' })}
//     console.log(farmObj)
//     const reqCode = await generateCodePattern(farmObj.location.governorate, cropObj);

//     const request = new Request({
//         code : reqCode,
//         user : userId,
//         createdBy : userId,
//         status : "inprogress",
//         farm : farmObj,
//         crop ,
//         varieties,
//         quality
//     });

//     let data = await request.save();
//     mail.send("no-reply@takweedegypt.net" ,
//     'info@mahaseel.net' ,
//      `New Request for crops: ${reqCode}`,
//       `we have recived a new request code its link is https://takweedegypt.com/admin/requests/view/${data._id.toString()}  plz follow up.`

//       )
//     if (!data) {
//         res.status(409).json({ message: 'Error Ocure while creating new farm' })
//     }
//     res.status(201).send({
//          reqcode : data.code,
//          status : data.status,
//          message: "Thank you Your request has been submit and created Successfully"
//         })
//     }
//     catch(error) {
//         //res.status(500).json({ message:error })
//         next(error)
//     }
// }

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.userId;
    const { farm, crop, varieties, quality /* docId */ } = req.body;
    if (!farm || !crop || !varieties || !quality) {
      res.status(409).json({ message: "Missing some paramters in your body" });
    }
    const farmObj = await FarmModel.findById(farm).populate(
      "location.governorate"
    );
    const cropObj = await CropModel.findById(crop);

    // check resources
    if (!farmObj) {
      res.status(409).json({ message: "invalid farm id" });
    }
    if (!cropObj) {
      res.status(409).json({ message: "invalid Crop id" });
    }
    const reqCode = await generateCodePattern(
      farmObj?.location.governorate as unknown as LocationDocument,
      cropObj as unknown as CropDocument
    );

    const request = new RequestModel({
      code: reqCode,
      user: userId,
      createdBy: userId,
      status: "inprogress",
      farm: farmObj,
      crop,
      varieties,
      quality
    });
    const data = await request.save();

    if (!data)
      res.status(409).json({ message: "Error Ocure while creating new farm" });

    res.status(201).send({
      reqId: data._id,
      reqcode: data.code,
      status: data.status,
      message: "Thank you Your request has been submit and created Successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getUrl = async (req: Request, res: Response) => {
  try {
    console.log("Start Download PDF File");
    const signedUrl = await bucket.file(req.params.code).getSignedUrl({
      action: "read",
      expires: new Date(Date.now() + 20 * 60000)
    });
    res.send({ url: signedUrl });
  } catch (err) {
    res.status(500).json({
      message: "Could not download the file. " + err
    });
  }
};

export const download = async (req: Request, res: Response) => {
  try {
    console.log("Start Download PDF File");
    const signedUrl = await bucket.file(req.params.code).getSignedUrl({
      action: "read",
      expires: new Date(Date.now() + 20 * 60000)
    });
    res.redirect(signedUrl.toString());
  } catch (err) {
    res.status(500).json({
      message: "Could not download the file. " + err
    });
  }
};

export const cancelled = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.userId;
    const reqId = req.params.reqId;
    const data = await RequestModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(reqId),
        user: new mongoose.Types.ObjectId(userId),
        cancelled: false
      },
      { cancelled: true },
      { new: true, lean: true }
    );
    if (!data) {
      res
        .status(409)
        .json({ message: "could not cancel the req,  resource not found" });
    }
    res.status(200).send({ message: "Request is cancelled Successfully" });
  } catch (error) {
    next(error);
  }
};

async function generateCodePattern(
  governorate: LocationDocument,
  crop: CropDocument
) {
  let codeStr = "";
  const today = new Date();
  const todayStr = today.toString();

  try {
    // This gets latest request created this year with same crop and location
    // If it finds it then creates a new code
    // Else increments the code.
    const res = await RequestModel.findOne({
      $expr: {
        $eq: [{ $year: "$createdAt" }, new Date().getFullYear()]
      },
      crop: new mongoose.Types.ObjectId(crop._id),
      "farm.location.governorate": new mongoose.Types.ObjectId(governorate._id)
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (
      res === null ||
      res.code.substring(0, 6) !==
        todayStr.substring(13, 15) + governorate.code + crop.code
    ) {
      codeStr =
        todayStr.substring(13, 15) + governorate.code + crop.code + "0001";
    } else {
      let codeNumbered = parseInt(res.code);
      codeNumbered += 1;
      codeStr = codeNumbered.toString();
    }
    return codeStr;
  } catch (err) {
    console.log(err);
  }
}

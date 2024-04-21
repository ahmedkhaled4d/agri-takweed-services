import { Storage } from "@google-cloud/storage";
import Busboy from "busboy";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import {
  CropModel,
  UserDocumentModel,
  FarmModel,
  InitialModel
} from "../../../models";
import { initailGetAgg } from "../aggregation/initial.agg";

const storage = new Storage({
  keyFilename: path.join(__dirname, "../../../config/serviceAccount.json"),
  projectId: "takweed-eg"
});
const bucket = storage.bucket("gs://takweed-docs");

export const handleIntitialRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.userId;
    // This generates a new unique code for the request to be used in the system until the request is approved and transfered to the next stage
    const reqCode = new Date().valueOf();
    const busboy = Busboy({ headers: req.headers });
    const uploadedDocs: Record<string, string> = {};
    let farm: string;
    let crop: string;
    let varieties: string;
    let quality: string;
    // Listen for event when Busboy finds a file to stream.
    busboy.on("file", function (_, file, info) {
      const { filename, mimeType } = info;
      // We are streaming! Handle chunks
      console.log("filename", JSON.stringify(filename));
      console.log("mimetype", JSON.stringify(mimeType));

      const blob = bucket.file(reqCode + "_takweed_" + filename);
      switch (filename) {
        case "id.jpg":
          uploadedDocs.id = reqCode + "_takweed_" + filename;
          break;
        case "agricultureAssociation.jpg":
          uploadedDocs.agricultureAssociation =
            reqCode + "_takweed_" + filename;
          break;
        case "ownership.jpg":
          uploadedDocs.ownership = reqCode + "_takweed_" + filename;
          break;
        case "possession.jpg":
          uploadedDocs.possesion = reqCode + "_takweed_" + filename;
          break;
        case "otherImg.jpg":
          uploadedDocs.otherImg = reqCode + "_takweed_" + filename;
          break;
      }

      const blobStream = blob.createWriteStream();

      blobStream.on("finish", () => {
        // The public URL can be used to directly access the file via HTTP.
        //  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      });

      file.on("data", async function (data) {
        // Here we can act on the data chunks streamed.
        blobStream.end(data);
        console.log("data", JSON.stringify(data));
      });

      // Completed streaming the file.
      file.on("end", async function () {
        // Here I need to get the stream to send to SQS
      });
    });

    // Listen for event when Busboy finds a non-file field.
    busboy.on("field", async function (fieldname, val) {
      // Do something with non-file field.
      console.log("field", fieldname);
      if (fieldname == "crop") {
        crop = val;
      }
      if (fieldname == "farm") {
        farm = val;
      }
      if (fieldname == "varieties") {
        varieties = JSON.parse(val);
      }
      if (fieldname == "quality") {
        quality = JSON.parse(val);
      }
    });

    // Listen for event when Busboy is finished parsing the form.
    busboy.on("finish", async function () {
      if (!farm || !crop || !varieties || !quality) {
        return res
          .status(409)
          .json({ message: "Missing some paramters in your body" });
      }
      const userDoc = new UserDocumentModel({
        code: reqCode,
        user: res.locals.user.userId,
        requestType: "takweed",
        docLinks: uploadedDocs
      });
      const docData = await userDoc.save();
      const farmObj = await FarmModel.findById(farm).populate(
        "location.governorate"
      );
      const cropObj = await CropModel.findById(crop);

      if (!farmObj) {
        return res.status(409).json({ message: "invalid farm id" });
      }
      if (!cropObj) {
        return res.status(409).json({ message: "invalid Crop id" });
      }
      console.log(farmObj);

      const initial = new InitialModel({
        code: reqCode,
        user: userId,
        createdBy: userId,
        farm: farmObj,
        crop,
        docs: docData._id,
        varieties,
        quality
      });

      const data = await initial.save();

      if (!data) {
        return res
          .status(409)
          .json({ message: "Error Ocure while creating new farm" });
      }
      res.status(201).send({
        reqcode: data.code,
        message:
          "Thank you Your request has been submit and created Successfully"
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (req.rawBody) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        busboy.end(req.rawBody);
      } else {
        req.pipe(busboy);
      }
    });

    // Pipe the HTTP Request into Busboy.
    // This is done because firebase serverless functions has rawBody while express doesnt
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (req.rawBody) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  } catch (err) {
    next(err);
  }
};

export const getUrl = async (req: Request, res: Response) => {
  try {
    const doc = await UserDocumentModel.findOne({ code: req.params.code });
    let idSignedUrl;
    let aaSignedUrl;
    let ownerSignedUrl;
    let possessionSignedUrl;
    let otherSignedUrl;
    if (doc?.docLinks.id) {
      idSignedUrl = await bucket
        .file(req.params.code + "_takweed_id.jpg")
        .getSignedUrl({
          action: "read",
          expires: new Date(Date.now() + 20 * 60000)
        });
    }
    if (doc?.docLinks.agricultureAssociation) {
      aaSignedUrl = await bucket
        .file(req.params.code + "_takweed_agricultureAssociation.jpg")
        .getSignedUrl({
          action: "read",
          expires: new Date(Date.now() + 20 * 60000)
        });
    }
    if (doc?.docLinks.ownership) {
      ownerSignedUrl = await bucket
        .file(req.params.code + "_takweed_ownership.jpg")
        .getSignedUrl({
          action: "read",
          expires: new Date(Date.now() + 20 * 60000)
        });
    }
    if (doc?.docLinks.possesion) {
      possessionSignedUrl = await bucket
        .file(req.params.code + "_takweed_possession.jpg")
        .getSignedUrl({
          action: "read",
          expires: new Date(Date.now() + 20 * 60000)
        });
    }
    if (doc?.docLinks.otherImg) {
      otherSignedUrl = await bucket
        .file(req.params.code + "_takweed_otherImg.jpg")
        .getSignedUrl({
          action: "read",
          expires: new Date(Date.now() + 20 * 60000)
        });
    }
    res.send({
      // idurl: idSignedUrl,
      // aaurl: aaSignedUrl,
      // ownerurl: ownerSignedUrl,
      // possurl: possessionSignedUrl,
      // otherurl: otherSignedUrl,
      doc,
      idSignedUrl,
      aaSignedUrl,
      ownerSignedUrl,
      possessionSignedUrl,
      otherSignedUrl
    });
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
    const data = await InitialModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(reqId),
        user: new mongoose.Types.ObjectId(userId),
        cancelled: false
      },
      { cancelled: true },
      { new: true, lean: true }
    );
    if (!data) {
      return res
        .status(409)
        .json({ message: "could not cancel the req,  resource not found" });
    }
    res.status(200).send({ message: "Request is cancelled Successfully" });
  } catch (error) {
    next(error);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.user.userId;
    const page = req.headers.page
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = req.headers.limit ? parseInt(req.headers.limit.toString()) : 5;
    const skip = page * limit;
    limit = limit + skip;
    const filter = {
      user: new mongoose.Types.ObjectId(userId),
      cancelled: { $ne: true }
    };

    const data = await InitialModel.aggregate(
      initailGetAgg({
        filter,
        skip,
        limit
      })
    );
    if (!data) {
      return res.status(204).json({ message: "No content" });
    }
    res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

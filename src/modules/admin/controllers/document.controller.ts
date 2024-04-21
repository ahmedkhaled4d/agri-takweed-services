import { NextFunction, Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import os from "os";
import path from "path";
import { ErrorMessage } from "../../../assets/errors";
import { UserDocumentModel } from "../../../models";
import { DocumentListAgg } from "../aggregations/document.agg";
import { generateDocumentPdf } from "../services/pdf.service";
import { uploadToGCP } from "../../../services";
import { HttpStatus } from "../../../assets/httpCodes";
import { escapeString } from "../../../helpers";

const storage = new Storage({
  keyFilename: path.join(__dirname, "../../../config/serviceAccount.json"),
  projectId: "takweed-eg"
});

const bucket = storage.bucket("gs://takweed-docs");

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.headers.page
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    let limit = 10;
    const skip = page * limit;
    limit = limit + skip;
    const data = await UserDocumentModel.aggregate(
      DocumentListAgg({
        filter: filterSearch(req.query),
        sortby: req.headers.sortby as string,
        sortvalue: parseInt(req.headers.sortvalue as string) || 1,
        limit,
        skip
      })
    );

    if (!data) {
      return res.status(204).json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const getUrl = async (req: Request, res: Response) => {
  try {
    console.log("Start Download PDF File");
    const signedUrl = await bucket
      .file(req.params.code + "_takweed" + ".pdf")
      .getSignedUrl({
        action: "read",
        expires: new Date(Date.now() + 20 * 60000)
      });
    return res.send({ url: signedUrl });
  } catch (err) {
    return res.status(500).json({
      message: "Could not download the file. " + err
    });
  }
};

export const genrateDocPdfController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code = req.params.code;
  try {
    const tmpdir = os.tmpdir();

    const doc = await UserDocumentModel.findOne({ code: code });

    if (!doc)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    if (doc.requestType == "takweed") {
      const certPath = path.join(tmpdir, doc.code + "_takweed" + ".pdf");

      console.log(doc.docLinks);
      const writeStream = await generateDocumentPdf({
        certpath: certPath,
        code: code,
        id: doc.docLinks.id,
        agricultureAssociation: doc.docLinks.agricultureAssociation,
        ownership: doc.docLinks.ownership,
        possesion: doc.docLinks.possesion,
        otherImg: doc.docLinks.otherImg
      });

      writeStream.on("finish", async () => {
        await uploadToGCP(certPath, "gs://takweed-docs");
        res.status(HttpStatus.OK).json({
          status: "document generate successful"
        });
      });

      writeStream.on("error", err => {
        next(err);
      });
      const pdfLink = doc.code + ".pdf";
      doc.pdfLink = pdfLink;
      doc.save();
    } else {
      return res.json({ message: "No Loans yet" });
    }
  } catch (err) {
    next(err);
  }
};

interface FilterType {
  name?: string;
  phone?: string;
  type?: string;
}

const filterSearch = (body: FilterType) => {
  const filter: Record<string, Record<string, string>> = {};
  if (!body) {
    return filter;
  }
  if (body.name) {
    filter["userName"] = { $regex: escapeString(body.name) };
  }
  if (body.phone) {
    filter["userPhone"] = { $eq: "+2" + body.phone };
  }
  if (body.type) {
    filter["requestType"] = { $eq: body.type };
  }
  return filter;
};

import { NextFunction, Request, Response } from "express";
import path from "path";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { Messages } from "../../../assets/strings";
import { RequestModel, RequestPopulatedForReport } from "../../../models";
import { requestRepo } from "../../../repositories/request.repository";
import { GoogleFileInfo } from "../../../types";
import { getBucket, uploadToGCPBuffer } from "../../../services";
import { sendByToken } from "../services/fcm.service";
import { generateCertPdf } from "../services/pdf.service";

const bucket = getBucket("gs://takweed-certificates");

export const reject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reqCode = req.params.code;

  try {
    if (!reqCode) {
      res.status(500).send({
        error: "Invalid code",
        code: "invalid_upload_file"
      });
    }
    const request = (await RequestModel.findOneAndUpdate(
      { code: reqCode },
      { status: "reject", certificate: null }
    )
      .populate("user")
      .lean()) as unknown as RequestPopulatedForReport;

    if (!request)
      return res.status(404).json({ message: "Couldnt find request" });

    const message =
      " رقم الطلب /  😢نأسف تم الغاء طلبك لتكويد مزرعه ❌" + request.code;
    sendByToken(request.user.fcm, message, {
      key: "screen",
      value: "myCrops"
    });
    res.json({
      message
    });
  } catch (error) {
    next(error);
  }
};

export const download = async (req: Request, res: Response) => {
  try {
    const signedUrl = await bucket.file(req.params.name).getSignedUrl({
      action: "read",
      expires: new Date(Date.now() + 20 * 60000)
    });
    res.redirect(signedUrl.toString());
  } catch (err) {
    res.status(500).send({
      message: "Could not download the file. " + err
    });
  }
};

export const getListFiles = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [files] = await bucket.getFiles();
    const fileInfos: Array<GoogleFileInfo> = [];
    files.forEach(file => {
      fileInfos.push({
        name: file.name,
        url: file.metadata.mediaLink,
        file
      });
    });

    res.status(200).send(fileInfos);
  } catch (err) {
    next(err);
  }
};

export const genrateCertPdfController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const Id = req.params.id;
  try {
    const reqOrder = await requestRepo.getRequestData(Id, { lean: false });

    // Check if request exists
    if (!reqOrder)
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    const certName = path.join(reqOrder.code + ".pdf");

    // And if it has GPX points with area
    if (!(reqOrder.gpx.length > 0) && !(reqOrder?.totalArea > 0))
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: ErrorMessage.NO_GPX_POINTS });

    // Generate Certificate
    const { result: pdfFileBuffer, err: pdfErr } = await generateCertPdf({
      code: reqOrder?.code,
      totalArea: reqOrder?.totalArea as unknown as number,
      gpx: reqOrder?.gpx,
      farm: reqOrder?.farm,
      user: reqOrder?.user.name,
      crop: reqOrder?.crop,
      sampleNumber: reqOrder?.sampleNumber
    });

    // if PDF has error stop.
    if (pdfErr || !pdfFileBuffer) return next(pdfErr);

    // // send the buffer file with a custom filename and content type
    // res.set("Content-disposition", `attachment; filename=test.pdf`);
    // // set mimetype (Content-Type) to "application/pdf"
    // res.type("pdf");
    //
    // // send result buffer, wrapped in a Promise due to firefunctions
    // return new Promise<void>(resolve => {
    //   res.writeHead(HttpStatus.OK);
    //   res.end(pdfFileBuffer, () => {
    //     resolve();
    //   });
    // });

    // Upload Cert to gStorage
    const { err: gcpError } = await uploadToGCPBuffer(
      certName,
      pdfFileBuffer,
      "gs://takweed-certificates"
    );

    // if GcpStorage has error stop.
    if (gcpError) return next(gcpError);
    res.status(HttpStatus.OK).json({
      status: "cert generate successful",
      download: `https://us-central1-takweed-eg.cloudfunctions.net/admin/cert/download/${reqOrder.code}.pdf`
    });

    // update request to include the certificate
    const certificateLink =
      "https://us-central1-takweed-eg.cloudfunctions.net/client/request/" +
      reqOrder.code +
      ".pdf";
    reqOrder.status = "accept";
    reqOrder.certificate = certificateLink;

    // Should we await here?
    await reqOrder.save();

    // await RequestModel.findOneAndUpdate(
    //   { code: reqOrder.code },
    //   { status: "accept", certificate: certificateLink },
    //   { lean: true }
    // );

    if (reqOrder.user.fcm && reqOrder.user.fcm.length > 0) {
      sendByToken(reqOrder.user.fcm, Messages.FCM.notifyForAcceptRequest, {
        key: "screen",
        value: "myCrops"
      });
    }
  } catch (err) {
    next(err);
  }
};

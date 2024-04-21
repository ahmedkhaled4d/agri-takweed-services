import { Storage } from "@google-cloud/storage";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import PDFDocument from "pdfkit";
import * as twitter_cldr from "twitter_cldr";
import { ErrorMessage } from "../../../assets/errors";
import { Messages } from "../../../assets/strings";
import { CropModel, StoreDocumentPopulated, StoreModel } from "../../../models";
import { GoogleFileInfo } from "../../../types";
import { dateStringArabic, reverseString } from "../../../utils/date.pipline";
import { sendByToken } from "../services/fcm.service";

const TwitterCldr = twitter_cldr.load("ar");

// Google lib
const storage = new Storage({
  keyFilename: path.join(__dirname, "../../../config/serviceAccount.json"),
  projectId: "takweed-eg"
});
const bucket = storage.bucket("gs://takweed-certificates");
// fonts
const dubaiBold = path.join(
  __dirname,
  "../../../assets/fonts/DubaiW23-Bold.ttf"
);
const dubaiReg = path.join(
  __dirname,
  "../../../assets/fonts/DubaiW23-Regular.ttf"
);

const maybeRtlize = (text: string) => {
  console.log(encodeURI(text));
  const bidiText = TwitterCldr.Bidi.from_string(text, { direction: "RTL" });
  bidiText.reorder_visually();
  console.log(encodeURI(bidiText.toString()));
  return bidiText
    .toString()
    .replace("(", "leftBracketSign")
    .replace(")", "rightBracketSign")
    .replace("leftBracketSign", ")")
    .replace("rightBracketSign", "(")
    .split("")
    .reverse()
    .join("");
};

export const getListFiles = async (_: Request, res: Response) => {
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
    console.log(err);

    res.status(500).send({
      message: "Unable to read list of files!"
    });
  }
};

export const genrateCertPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const Id = req.params.id;
  try {
    const tmpdir = os.tmpdir();

    const storeOrder = (await StoreModel.findById(Id)
      .populate("crop", `-varieties -createdAt -updatedAt`)
      .populate({
        path: "location.governorate",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "location.center",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate({
        path: "location.hamlet",
        model: "location",
        select: { name_ar: 1, code: 1, coordinates: 1 }
      })
      .populate(
        "user",
        `-accessToken -password`
      )) as unknown as StoreDocumentPopulated;

    if (!storeOrder)
      return res.status(409).json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    const certPath = path.join(tmpdir, storeOrder.code + ".pdf");

    if (storeOrder.coordinates.lat && storeOrder.coordinates.lng) {
      generatePDF(
        {
          code: storeOrder.code,
          location: storeOrder.location,
          coordinates: storeOrder.coordinates,
          certPath,
          name: storeOrder.name,
          user: storeOrder.user.name as string,
          crop: storeOrder.crop
        },
        (writeStream: fs.WriteStream) => {
          writeStream.on("finish", async () => {
            await uploadToGCP(certPath, () => {
              res.json({
                status: "cert generate successful",
                download: `https://us-central1-takweed-eg.cloudfunctions.net/admin/cert/download/store_${storeOrder.code}.pdf`
              });
            });
          });
        }
      );
      const certificateLink =
        "https://us-central1-takweed-eg.cloudfunctions.net/admin/store/" +
        storeOrder.code +
        ".pdf";
      await StoreModel.findOneAndUpdate(
        { code: storeOrder.code },
        { certificate: certificateLink },
        { lean: true }
      );
      if (storeOrder?.user?.fcm) {
        if (storeOrder?.user?.fcm?.length >= 0) {
          sendByToken(
            storeOrder.user.fcm as unknown as string,
            Messages.FCM.notifyForAcceptRequest,
            {
              key: "screen",
              value: "myCrops"
            }
          );
        }
      }
    } else {
      return res.status(409).json({ message: ErrorMessage.NO_GPX_POINTS });
    }
  } catch (err) {
    next(err);
  }
};

interface GeneratePdfData
  extends Pick<
    StoreDocumentPopulated,
    "code" | "location" | "coordinates" | "name" | "crop"
  > {
  user: string;
  certPath: string;
}

async function generatePDF(
  data: GeneratePdfData,
  // eslint-disable-next-line no-unused-vars
  res: (writeStream: fs.WriteStream) => void
) {
  const timeElapsed = Date.now();
  // TODO: Why use this? we already have crop
  const cropData = await CropModel.findById(data.crop._id);
  if (!cropData)
    throw new Error("Crop Data not defined! StoreCert > GeneratePDF line 173");

  const today = new Date(timeElapsed);
  const pdfDoc = new PDFDocument({ size: "A4" });
  const writeStream = fs.createWriteStream(data.certPath);

  pdfDoc.pipe(writeStream);
  pdfDoc.font(dubaiBold);
  // pdfDoc.pipe(res);
  pdfDoc.fontSize(24).text("شهادة مطابقة بيانات", 55, 55, {
    align: "center",
    features: ["rtla"]
  });
  pdfDoc.font(dubaiReg);
  pdfDoc.fontSize(12).text(dateStringArabic(today), {
    align: "right",
    features: ["rtla"]
  });
  pdfDoc.fontSize(12).text("رقم طلب ", 157, 103, {
    features: ["rtla"]
  });
  pdfDoc.fontSize(12).text(data.code, 80, 103);

  pdfDoc
    .fontSize(12)
    .text(
      "تشهد شركة محاصيل مصر – شركة مساهمه مصرية - بأن البيانات المقدمة  : ",
      {
        features: ["rtla"],
        // width:-700,
        align: "right"
      }
    );

  pdfDoc.font(dubaiBold);

  pdfDoc.fontSize(12).text("الخاص بمحطة تعبئة : " + maybeRtlize(data.name), {
    features: ["rtla"],
    align: "right"
  });

  pdfDoc
    .fontSize(12)
    .text(
      "الكائنة ناحية : " +
        data.location.governorate.name_ar +
        "-" +
        data.location.center.name_ar +
        "-" +
        data.location.hamlet.name_ar,
      {
        features: ["rtla"],
        align: "right"
      }
    );
  pdfDoc.font(dubaiReg);
  pdfDoc
    .fontSize(12)
    .text(
      "بيانات صحيحه وان الاحداثيات التي تم رفعها باستخدام الجي بي اس هي كالاتي:",
      {
        features: ["rtla"],
        align: "right"
      }
    );
  let y = 225;

  pdfDoc.fontSize(12).text("م", 511, y, {
    features: ["rtla"]
  });
  pdfDoc.rect(125, y, 380, 30).stroke();

  pdfDoc.fontSize(12).text("الصنف", 80, y, {
    features: ["rtla"],
    align: "center"
  });
  pdfDoc.rect(505, y, 40, 30).stroke();

  y += 30;

  pdfDoc.rect(505, y, 40, 25).stroke();
  pdfDoc.fontSize(12).text("1", 511, y + 2, {
    features: ["rtla"],
    width: 80
  });
  pdfDoc.rect(125, y, 380, 25).stroke();
  pdfDoc.fontSize(12).text(cropData.name_ar, 105, y + 2, {
    features: ["rtla"],
    width: 380,
    align: "center"
  });

  pdfDoc.fontSize(14).text("\n");
  pdfDoc
    .fontSize(12)
    .text(
      "احداثيات المنتصف لهذه المزرعة هي : " +
        reverseString(data.coordinates.lat.toString()) +
        ", " +
        reverseString(data.coordinates.lng.toString()),
      {
        features: ["rtla"],
        align: "right"
      }
    );
  pdfDoc.font(dubaiReg);
  pdfDoc
    .fontSize(12)
    .text(
      " علما بأن هذه الشهادة استرشاديه ولا يعتد بها لأي غرض اخر غير الغرض الذي اعدت له وهو تحديد مساحات الزراعات المقدمة في الطلب",
      {
        features: ["rtla"],
        align: "right"
      }
    );
  pdfDoc
    .fontSize(12)
    .text("                      وتفضلوا بقبول فائق الاحترام", {
      features: ["rtla"],
      align: "center"
    });
  pdfDoc.fontSize(12).text("م/ محمد عبد الرحمن", {
    features: ["rtla"],
    align: "right"
  });
  pdfDoc.fontSize(12).text("المدير التنفيذي ورئيس مجلس الإدارة", {
    features: ["rtla"],
    align: "right"
  });

  pdfDoc.end();
  res(writeStream);
}

async function uploadToGCP(
  fileName: string,
  // eslint-disable-next-line no-unused-vars
  file: (item: Promise<void>) => void
) {
  const options = {
    gzip: true,
    metadata: {
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: "public, max-age=31536000"
    }
  };
  // storage file
  file(
    storage
      .bucket("gs://takweed-certificates")
      .upload(fileName, options)
      .then(() => console.log(`${fileName} - File upload successful`))
      .catch(e => console.error(e))
      .finally(() => {
        try {
          fs.unlinkSync(fileName);
        } catch (error) {
          console.log(error);
          throw error;
        }
      })
  );
}

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

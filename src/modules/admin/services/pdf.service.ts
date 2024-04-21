import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as Twitter from "twitter_cldr";
import { HttpStatus } from "../../../assets/httpCodes";
import {
  Crop,
  CropModel,
  DocLinks,
  GeometryModel,
  RequestModel,
  RequestPopulatedForReport
} from "../../../models";
import { getBucket } from "../../../services";
import { getCenterPoint, HttpError, roundToTwo } from "../../../utils";
import { dateStringArabic, reverseString } from "../../../utils/date.pipline";
import { interAggregate, tableDataAgg } from "../aggregations/pdf/pdf.agg";
import { HistoryDataForPdf } from "../aggregations/pdf/trace.history.cert.agg";

// TODO: Look into refactoring buffers to streams, as they are more efficient for large files.
// Currently the pdfkit holds the pdffile in memory, which is not ideal for large files.
// Then we take that file from memory to put it into a buffer, which is also not ideal.
// as a buffer is literally a copy of the file in memory, meaning we move the file twice in memory.

const heveticArabic = path.join(
  __dirname,
  "../../../assets/fonts/helveticaneueltarabic-roman.ttf"
);
const dubaiBold = path.join(
  __dirname,
  "../../../assets/fonts/DubaiW23-Bold.ttf"
);
const dubaiReg = path.join(
  __dirname,
  "../../../assets/fonts/DubaiW23-Regular.ttf"
);

const bucket = getBucket("gs://takweed-docs");

// TODO: Refactor this to use the utils arabic file instead.
const TwitterCldr = Twitter.load("ar");
const maybeRtlize = (text: string): string => {
  text = text.toString().replaceAll("/", "ForwardSlashSign");

  const bidiText = TwitterCldr.Bidi.from_string(text, { direction: "RTL" });

  bidiText.reorder_visually();

  return bidiText
    .toString()
    .replaceAll("(", "leftBracketSign")
    .replaceAll(")", "rightBracketSign")
    .replaceAll("leftBracketSign", ")")
    .replaceAll("rightBracketSign", "(")
    .replaceAll("ForwardSlashSign", "/")
    .split("")
    .reverse()
    .join("");
};

export interface GenerateDocumentPdfData extends DocLinks {
  code: string;
  certpath: string;
}

export async function generateDocumentPdf(data: GenerateDocumentPdfData) {
  const pdfDoc = new PDFDocument({ size: "A4", compress: true });
  const writeStream = fs.createWriteStream(data.certpath);
  pdfDoc.pipe(writeStream);
  pdfDoc.font(dubaiBold);
  if (data.id) {
    const idSignedUrl = await bucket
      .file(data.code + "_takweed_id.jpg")
      .download();

    pdfDoc.fontSize(24).text("صورة البطاقة", 55, 45, {
      align: "center",
      features: ["rtla"]
    });
    pdfDoc.image(idSignedUrl[0], 25, 130, { fit: [550, 500] });
  }
  if (data.agricultureAssociation) {
    const aaSignedUrl = await bucket
      .file(data.code + "_takweed_agricultureAssociation.jpg")
      .download();
    pdfDoc.addPage({ size: "A4" });
    pdfDoc.fontSize(24).text("صورة افادة الجمعية الزراعية", 55, 45, {
      align: "center",
      features: ["rtla"]
    });
    pdfDoc.image(aaSignedUrl[0], 25, 130, { fit: [550, 500] });
  }
  if (data.ownership) {
    const ownerSignedUrl = await bucket
      .file(data.code + "_takweed_ownership.jpg")
      .download();
    pdfDoc.addPage({ size: "A4" });
    pdfDoc.fontSize(24).text("صورة عقد الايجار او التمليك", 55, 45, {
      align: "center",
      features: ["rtla"]
    });
    pdfDoc.image(ownerSignedUrl[0], 25, 130, { fit: [550, 500] });
  }
  if (data.possesion) {
    const possessionSignedUrl = await bucket
      .file(data.code + "_takweed_possession.jpg")
      .download();
    pdfDoc.addPage({ size: "A4" });
    pdfDoc.fontSize(24).text("صورة عقد حيازة", 55, 45, {
      align: "center",
      features: ["rtla"]
    });
    pdfDoc.image(possessionSignedUrl[0], 25, 130, { fit: [550, 500] });
  }
  if (data.otherImg) {
    const otherSignedUrl = await bucket
      .file(data.code + "_takweed_otherImg.jpg")
      .download();
    pdfDoc.addPage({ size: "A4" });
    pdfDoc.fontSize(24).text("صورة أخرى", 55, 45, {
      align: "center",
      features: ["rtla"]
    });
    pdfDoc.image(otherSignedUrl[0], 25, 130, { fit: [550, 500] });
  }
  pdfDoc.end();
  return writeStream;
}

export interface GenerateCertPdfData
  extends Pick<
    RequestPopulatedForReport,
    "code" | "totalArea" | "gpx" | "farm" | "crop" | "sampleNumber"
  > {
  user: string;
}

export async function generateCertPdf(data: GenerateCertPdfData) {
  try {
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);

    const buffer: Array<Uint8Array | Buffer> = [];

    const pdfDoc = new PDFDocument({ size: "A4" });
    const [intersections, certData, cropData] = await Promise.all([
      GeometryModel.aggregate(interAggregate(data.code)),
      RequestModel.aggregate(tableDataAgg(data.code)),
      CropModel.findById(data.crop._id) as unknown as Promise<Crop>
    ]);

    pdfDoc.font(dubaiBold);

    // const refTo = " الخاص بــمزرعة "+":" +data.farm.name
    //  pdfDoc.fontSize(24).text("شهادة مطابقة بيانات",55,55, {
    pdfDoc.fontSize(24).text("شهادة تكويد محصول زراعي", 55, 45, {
      align: "center",
      features: ["rtla"]
    });

    const resQR = await QRCode.toDataURL(
      "https://takweedegypt.com/client/certificate/" + data.code
    );
    pdfDoc.image(resQR, 50, 130, { fit: [80, 80] });
    pdfDoc.fontSize(16).text("know Your Farm", 55, 80, {
      align: "center",
      features: ["ltra"]
    });
    pdfDoc.font(dubaiReg);
    pdfDoc.fontSize(12).text(dateStringArabic(today), 320, 103, {
      align: "right",
      features: ["rtla"],
      width: 200
    });
    pdfDoc.fontSize(12).text("رقم طلب ", 157, 103, {
      features: ["rtla"]
    });
    pdfDoc.fontSize(12).text(data.code, 80, 103);

    pdfDoc
      .fontSize(12)
      .text(
        "تشهد شركة محاصيل مصر – شركة مساهمة مصرية - بأن البيانات المقدمة  : ",
        {
          features: ["rtla"],
          //  width:-700,
          align: "right"
        }
      );

    pdfDoc.font(dubaiBold);
    if (intersections.length > 0) {
      pdfDoc
        .fontSize(12)
        .text(
          " الخاص بــمزرعة " + ":" + maybeRtlize(data.farm.name) + ")متداخلة(",
          150,
          141,
          {
            features: ["rtla"],
            align: "right",
            width: 380
          }
        );
    } else {
      pdfDoc
        .fontSize(12)
        .text(
          " الخاص بــمزرعة " + ":" + maybeRtlize(data.farm.name),
          150,
          141,
          {
            features: ["rtla"],
            align: "right",
            width: 380
          }
        );
    }

    pdfDoc
      .fontSize(12)
      .text(
        "الكائنة ناحية : " +
          data.farm.location.governorate.name_ar +
          "-" +
          data.farm.location.center.name_ar +
          "-" +
          maybeRtlize(data.farm.location.hamlet.name_ar),
        {
          features: ["rtla"],
          align: "right"
        }
      );
    pdfDoc.font(dubaiReg);
    pdfDoc
      .fontSize(12)
      .text(
        "بيانات صحيحة وأن المساحة الفعلية التي تم رفعها باستخدام الجي بي اس هي كالاتي:",
        {
          features: ["rtla"],
          align: "right"
        }
      );
    let y = 225;
    pdfDoc.rect(15, y, 110, 30).stroke();
    pdfDoc.fontSize(12).text("ق", 511, y, {
      features: ["rtla"]
    });
    pdfDoc.rect(125, y, 380, 30).stroke();

    pdfDoc.fontSize(12).text(cropData.name_ar, 80, y, {
      features: ["rtla"],
      align: "center"
    });
    pdfDoc.rect(505, y, 40, 30).stroke();
    pdfDoc.fontSize(12).text("المساحة", 40, y, {
      features: ["rtla"]
    });
    y += 30;

    certData.forEach(item => {
      if (!item._id) throw new HttpError("no variety", HttpStatus.BAD_REQUEST);
      pdfDoc.rect(15, y, 110, 25).stroke();
      pdfDoc.fontSize(12).text(item.count, 511, y + 2, {
        features: ["rtla"],
        width: 80
      });
      pdfDoc.rect(125, y, 380, 25).stroke();
      pdfDoc.fontSize(12).text(maybeRtlize(item._id), 105, y + 2, {
        features: ["rtla"],
        width: 380,
        align: "center"
      });
      pdfDoc.rect(505, y, 40, 25).stroke();
      pdfDoc
        .fontSize(12)
        .text(roundToTwo(item.totalVarietyArea).toString(), 20, y + 2, {
          width: 85,
          features: ["rtla"],
          align: "right"
        });
      pdfDoc.fontSize(12).text("فدان", 30, y + 2, {
        width: 85,
        features: ["rtla"]
      });
      y += 25;
      if (y >= 750) {
        y = 10;
        pdfDoc.addPage({ size: "A4" });
      }
    });

    pdfDoc.fontSize(14).text("\n");

    const center = getCenterPoint(data.gpx[0].points);

    pdfDoc
      .fontSize(12)
      .text(
        "احداثيات المنتصف لهذه المزرعة هي : " +
          reverseString(center?.lat.toString() ?? "") +
          ", " +
          reverseString(center?.lng.toString() ?? ""),
        {
          features: ["rtla"],
          align: "right"
        }
      );
    pdfDoc.font(dubaiBold);
    pdfDoc
      .fontSize(12)
      .text(
        "وأن المساحة الكلية الفعلية بالفدان هي :  " +
          reverseString(data.totalArea.toString()),
        {
          features: ["rtla"],
          align: "right"
        }
      );

    pdfDoc.font(dubaiReg);
    pdfDoc
      .fontSize(12)
      .text(
        " علماً بأن هذه الشهادة استرشادية ولا يعتد بها لأي غرض اخر غير الغرض الذي اعدت له وهو تحديد مساحات الزراعات المقدمة في الطلب",
        {
          features: ["rtla"],
          align: "right"
        }
      );
    if (intersections.length > 0) {
      pdfDoc.font(dubaiBold);
      pdfDoc.fontSize(12).text("ملحوظة:", {
        features: ["rtla"],
        align: "right"
      });
      for (let i = 0; i < intersections[0].intersectionsData.length; i++) {
        pdfDoc
          .fontSize(12)
          .text(
            "قطعة " +
              reverseString(
                intersections[0].intersectionsData[i].originalPiece
              ) +
              " تتداخل مع قطعة " +
              reverseString(
                intersections[0].intersectionsData[i].pieceIntersected
              ) +
              " من مزرعة " +
              maybeRtlize(intersections[0].intersectionsData[i].farmName) +
              " بمساحة قدرها " +
              reverseString(
                intersections[0].intersectionsData[
                  i
                ].areaOfIntersection.toString()
              ) +
              " فدان ",
            {
              features: ["rtla"],
              align: "right"
            }
          );
      }
    }
    pdfDoc.font(heveticArabic);

    pdfDoc.fontSize(12).text("وتفضلوا بقبول فائق الاحترام", {
      features: ["rtla"],
      align: "center",
      width: 600
    });
    pdfDoc.fontSize(12).text("م/ محمد عبد الرحمن", {
      features: ["rtla"],
      align: "right"
    });
    pdfDoc.fontSize(12).text("المدير التنفيذي ورئيس مجلس الإدارة", {
      features: ["rtla"],
      align: "right"
    });

    pdfDoc.font(dubaiReg);
    pdfDoc.fontSize(12).text("رقم عينة ", 157, 90, {
      features: ["rtla"]
    });
    pdfDoc.fontSize(12).text(data.sampleNumber ?? "", 80, 90);

    pdfDoc.end();

    // PDF Doc is a readable readstream
    // We wait the stream to get Data,
    // On Event ('End') the loop finishs
    for await (const chunk of pdfDoc) buffer.push(chunk as Buffer);

    return { result: Buffer.concat(buffer), err: null };
  } catch (e) {
    return { result: null, err: e };
  }
}

const translate = (type: string): string => {
  switch (type) {
    case "DISTRIBUTER":
      return "موزع";
    case "STORE":
      return "مخزن";
    case "EXPORT":
      return "ميناء";
    case "FARM":
      return "مزرعة";
    case "PRIVATE_SECTOR":
      return "قطاع خاص";
    case "PERSON":
      return "شخص";
    case "PUBLIC_SECTOR":
      return "قطاع عام";
    case "GOVERNMENTAL_ENTITY":
      return "جهة حكومية";
    default:
      return "غير محدد";
  }
};

export async function generateHistoryReqTraceCertPdf(
  data: HistoryDataForPdf
): Promise<
  | {
      result: Buffer;
      err: null;
    }
  | {
      result: null;
      err: Error | unknown;
    }
> {
  try {
    const buffer: Array<Uint8Array | Buffer> = [];

    const pdf = new PDFDocument({ size: "A4" });
    pdf.registerFont("DubaiBold", dubaiBold);
    pdf.registerFont("DubaiReg", dubaiReg);

    pdf.font(dubaiBold);
    pdf
      .fontSize(12)
      .font("DubaiBold")
      .text(
        "جمهورية مصر العرربية\n" +
          "وزراة الزراعة و استصلاح الاراضي\n" +
          "الادارة المركزية للحجز الزراعي\n" +
          "ادارة خدمة المصدرين",
        0,
        20,
        {
          features: ["rtla"],
          align: "right"
        }
      );

    pdf.image(path.join(__dirname, "../../../assets/images/logo.jpg"), 6, -5, {
      width: 140
    });
    pdf
      .fontSize(18)
      .font("DubaiBold")
      .text(
        `مستند تخصيم ﻷصناف محصول ال${data.cropName} للموسم ${maybeRtlize(
          data.season.toLocaleString("ar-EG", { useGrouping: false })
        )} `,
        125,
        110,
        {
          features: ["rtla"]
        }
      );
    pdf
      .fontSize(16)
      .font("DubaiReg")
      .text("كود الحركة:" + maybeRtlize(data.historyId), 140, 140, {
        features: ["rtla"],
        align: "right"
      });
    pdf
      .fontSize(16)
      .font("DubaiReg")
      .text(
        "بتاريخ: " +
          maybeRtlize(
            new Date(data.transactionDate).toLocaleDateString("ar-EG", {
              // use style day writtenMonth year
              day: "numeric",
              month: "long",
              year: "numeric"
            })
          ),
        110,
        140,
        {
          features: ["rtla"]
        }
      );

    pdf.fontSize(6).text(" ", {
      features: ["rtla"],
      align: "right"
    });

    pdf
      .fontSize(16)
      .font("DubaiBold")
      .text("بيانات المزرعة: ", {
        features: ["rtla"],
        align: "right"
      });

    pdf
      .fontSize(14)
      .font("DubaiReg")
      .text("اسم المزرعة: " + maybeRtlize(data.farmName), {
        features: ["rtla"],
        align: "right"
      });
    pdf
      .fontSize(14)
      .font("DubaiReg")
      .text("لصالح: " + maybeRtlize(data.farmOwner.name), {
        features: ["rtla"],
        align: "right"
      });
    pdf
      .fontSize(14)
      .font("DubaiReg")
      .text("كود المزرعة: " + maybeRtlize(data.code), {
        features: ["rtla"],
        align: "right"
      });

    const resQR = await QRCode.toDataURL(
      `https://takweedegypt.com/traceCert/${data.code}-${data.historyId}`
    );

    pdf.image(resQR, 40, 220, { fit: [125, 80] });

    if (data.from) {
      pdf
        .fontSize(16)
        .font("DubaiBold")
        .text("بيانات المحطة المصدرة:", {
          features: ["rtla"],
          align: "right"
        });

      pdf.font("DubaiReg");

      pdf.fontSize(14).text("اسم المحطة: " + maybeRtlize(data.from.name), {
        features: ["rtla"],
        align: "right"
      });
      pdf.fontSize(14).text("كود المحطة:" + maybeRtlize(data.from.code), {
        features: ["rtla"],
        align: "right"
      });
      pdf
        .fontSize(14)
        .text("نوع المحطة: " + maybeRtlize(translate(data.from.type)), {
          features: ["rtla"],
          align: "right"
        });
      pdf
        .fontSize(14)
        .text("نوع المالك: " + maybeRtlize(translate(data.from.ownerType)), {
          features: ["rtla"],
          align: "right"
        });
      pdf
        .fontSize(14)
        .text(
          "العنوان: " +
            data.from.gov +
            " - " +
            data.from.center +
            " - " +
            data.from.hamlet,
          {
            features: ["rtla"],
            align: "right"
          }
        );

      pdf
        .fontSize(16)
        .font("DubaiBold")
        .text("بيانات المحطة المستقبلة: ", {
          features: ["rtla"],
          align: "right"
        });

      pdf.font("DubaiReg");

      pdf.fontSize(14).text("اسم المحطة: " + maybeRtlize(data.to.name), {
        features: ["rtla"],
        align: "right"
      });
      pdf.fontSize(14).text("كود المحطة:" + maybeRtlize(data.to.code), {
        features: ["rtla"],
        align: "right"
      });
      pdf
        .fontSize(14)
        .text("نوع المحطة: " + maybeRtlize(translate(data.to.type)), {
          features: ["rtla"],
          align: "right"
        });
      pdf
        .fontSize(14)
        .text("نوع المالك: " + maybeRtlize(translate(data.to.ownerType)), {
          features: ["rtla"],
          align: "right"
        });
      pdf
        .fontSize(14)
        .text(
          "العنوان: " +
            data.to.gov +
            " - " +
            data.to.center +
            " - " +
            data.to.hamlet,
          {
            features: ["rtla"],
            align: "right"
          }
        );
    } else {
      pdf
        .fontSize(14)
        .text(
          "العنوان: " +
            data.farmLoc.governorate +
            " - " +
            data.farmLoc.center +
            " - " +
            data.farmLoc.hamlet,
          {
            features: ["rtla"],
            align: "right"
          }
        );

      pdf
        .fontSize(16)
        .font("DubaiBold")
        .text("بيانات المحطة المستقبلة: ", {
          features: ["rtla"],
          align: "right"
        });

      pdf.font("DubaiReg");

      pdf.fontSize(14).text("اسم المحطة: " + maybeRtlize(data.to.name), {
        features: ["rtla"],
        align: "right"
      });
      pdf.fontSize(14).text("كود المحطة:" + maybeRtlize(data.to.code), {
        features: ["rtla"],
        align: "right"
      });
      pdf
        .fontSize(14)
        .text("نوع المحطة: " + maybeRtlize(translate(data.to.type)), {
          features: ["rtla"],
          align: "right"
        });
      pdf
        .fontSize(14)
        .text("نوع المالك: " + maybeRtlize(translate(data.to.ownerType)), {
          features: ["rtla"],
          align: "right"
        });
      pdf
        .fontSize(14)
        .text(
          "العنوان: " +
            data.to.gov +
            " - " +
            data.to.center +
            " - " +
            data.to.hamlet,
          {
            features: ["rtla"],
            align: "right"
          }
        );
    }

    // draw rectangle with vaierty and amount of data in it
    pdf.rect(40, 580, 500, 50).stroke();
    pdf
      .fontSize(16)
      .font("DubaiBold")
      .text("الصنف", 400, 580, {
        features: ["rtla"]
      });
    pdf
      .fontSize(16)
      .font("DubaiBold")
      .text("الكمية", 150, 580, {
        features: ["rtla"]
      });
    pdf.moveTo(300, 580).lineTo(300, 605).stroke();
    pdf.moveTo(300, 605).lineTo(300, 630).stroke();
    pdf.moveTo(40, 605).lineTo(540, 605).stroke();

    pdf
      .fontSize(14)
      .font("DubaiReg")
      .text(data.variety, 400, 605, {
        features: ["rtla"]
      });
    pdf
      .fontSize(14)
      .font("DubaiReg")
      .text(maybeRtlize(data.amount.toLocaleString("ar-EG")), 150, 605, {
        features: ["rtla"]
      });

    pdf.fontSize(6).text(" ", { features: ["rtla"], align: "right" });
    pdf
      .fontSize(12)
      .font("DubaiBold")
      .text("تعليمات مهمة:", {
        features: ["rtla", "unic"],
        align: "right",
        underline: true
      });

    pdf
      .fontSize(12)
      .font("DubaiBold")
      .text(
        (1).toLocaleString("ar-Eg") +
          "- هذا المستند مسئولية المزرعة و الشركة المصدرة و يتحملا اي مسئولية قانونية قد تنتج عن التلاعب في بياناته و الكميات دون ادني مسئولية علي الحجر الزراعي المصري",
        {
          features: ["rtla"],
          align: "right"
        }
      );
    pdf
      .fontSize(12)
      .font("DubaiBold")
      .text(
        (2).toLocaleString("ar-Eg") +
          "- الكميات بهذا المستند تخص المزرعة و الاطراف المذكورين فقط ولا يجوز التنازل او التخصيم لصالح اي طرف اخر.",
        {
          features: ["rtla"],
          align: "right"
        }
      );

    pdf
      .fontSize(14)
      .font("DubaiBold")
      .text(
        "تحرير في: " +
          maybeRtlize(
            new Date().toLocaleString("ar-EG", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })
          ),
        100,
        740,
        {
          features: ["rtla"]
        }
      );
    // save pdf
    pdf.end();

    // PDF Doc is a readable readstream
    // We wait the stream to get Data,
    // On Event ('End') the loop finishs
    for await (const chunk of pdf) buffer.push(chunk as Buffer);

    return { result: Buffer.concat(buffer), err: null };
  } catch (e) {
    return { result: null, err: e };
  }
}

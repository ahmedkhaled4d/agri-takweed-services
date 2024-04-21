import Busboy from "busboy";
import Excel from "exceljs";
import { error as errorLogger, info } from "firebase-functions/logger";
import mongoose from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { CropModel, FarmModel, LocationModel } from "../../../models";
import * as LoggerService from "../../../repositories/logger.repository";
import { requestRepo } from "../../../repositories/request.repository";
import { ExpressFunc } from "../../../types";
import { HttpError, getPhone } from "../../../utils";

function getVarieties(varieties: string, area: string) {
  // check if varieties and area are equal
  try {
    const varietiesArray = varieties.match(/\n/g)
      ? varieties.split("\n")
      : varieties.match(/-/g)
      ? varieties.split("-")
      : [varieties];
    const areaArray =
      typeof area === "number"
        ? [area]
        : area.match(/\n/g)
        ? area.split("\n")
        : area.match(/-/g)
        ? area.split("-")
        : [area];
    if (varietiesArray.length !== areaArray.length) {
      return {
        varieties: null,
        area: null
      };
    }
    return {
      varieties: varietiesArray.join("-"),
      area: areaArray.join("-")
    };
  } catch (err) {
    errorLogger(err);
    return {
      varieties: null,
      area: null
    };
  }
}

export const createRequestsAndFarms: ExpressFunc = async (req, res, next) => {
  // WARN: 2023-05-01 They don't want to stop in case of an issue
  // Continue normally and if issue occurs stop at that item.
  // But I think it's better to stop at the first issue, so I will do that. TOO BAD!

  // either commit or abort the transaction
  const session = await mongoose.startSession();
  const totalData = req.body.totalData;

  let index = 0;
  try {
    session
      .withTransaction(async () => {
        // sets a standard date for all requests
        const dateTo = new Date();
        dateTo.setMonth(dateTo.getMonth() + 3);
        const dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        const pickingFrom = `${dateFrom.getFullYear()}-${
          dateFrom.getMonth() + 1
        }-${dateFrom.getDate()}`;
        const pickingTo = `${dateTo.getFullYear()}-${
          dateTo.getMonth() + 1
        }-${dateTo.getDate()}`;

        if (!totalData || !Array.isArray(totalData))
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json({ message: "Bad Data!" });

        for (let i = 0; i < totalData.length; i++) {
          index = totalData[i].index;
          const {
            dayOfWeek,
            date: inspectionDate,
            mahaseelEngineer,
            plantQuarantineEngineer,
            visitDetails,
            representative,
            representativePhone,
            farmName,
            owner,
            ownerPhone,
            governorate,
            center,
            hamlet,
            crop,
            varieties,
            area,
            sampleNumber
          } = totalData[i];

          // default: "61a4e853313cb01f3b64e295"
          const userId = res.locals.user.userId;

          // get location and crop to check if they exist
          // NOTE: No need to pass session here because we are not modifying the data
          const hamletObj = await LocationModel.findById(hamlet);
          const centerObj = await LocationModel.findById(center);
          const governorateObj = await LocationModel.findById(governorate);

          const cropObj = await CropModel.findById(crop);

          if (!centerObj || !governorateObj || !hamletObj || !cropObj) {
            errorLogger(`Transaction aborted ExcelData Farms at ${index}\n`, {
              centerObjExists: centerObj !== null,
              governorateObjExists: governorateObj !== null,
              hamletObjExists: hamletObj !== null,
              cropObjExists: cropObj !== null
            });
            throw new HttpError(
              "Bad Location! or Crop!",
              HttpStatus.BAD_REQUEST
            );
          }

          const varietiesData = varieties.map(
            (variety: string, index: number) => {
              return {
                name: variety,
                parts: 1,
                area: { value: parseInt(area[index]), unit: "فدان" },
                quantity: { value: 50, unit: "طن" },
                picking: { from: pickingFrom, to: pickingTo }
              };
            }
          );

          const location = {
            governorate: governorate,
            center: center,
            hamlet: hamlet,
            address: {
              address: hamletObj?.name_ar,
              landmark: hamletObj?.name_ar
            }
          };
          const quality: Array<Record<string, unknown>> = [];

          const farmData = await FarmModel.create(
            [
              {
                // sometimes there is a space at the start of the name and end, remove it
                name: (farmName as string).trimStart().trimEnd(),
                owner,
                representative,
                representativePhone,
                phone: ownerPhone,
                user: userId,
                location,
                color: "62645"
              }
            ],
            { session: session }
          );

          const {
            data: reqData,
            message,
            error
          } = await requestRepo.addRequest(
            {
              user: userId,
              farm: farmData[0],
              crop: cropObj._id,
              varieties: varietiesData,
              sampleNumber,
              dayOfWeek,
              inspectionDate,
              mahaseelEngineer,
              visitDetails,
              plantQuarantineEngineer,
              quality
            },
            { govObj: governorateObj, cropObj: cropObj },
            session
          );
          if (error || !reqData)
            throw new HttpError(message, HttpStatus.BAD_REQUEST);

          totalData[i] = {
            ...totalData[i],
            // Append items for use in the frontend
            _id: reqData._id,
            code: reqData.code,
            centerName: centerObj.name_ar,
            governorateName: governorateObj.name_ar,
            hamletName: hamletObj.name_ar,
            cropName: cropObj.name_ar
          };
          info(
            `Finished creating request and farm number: ${i} index: ${totalData[i].index} code: ${reqData.code}`
          );
        }
        return res.json({ totalData });
      })
      .then(() => {
        if (res.headersSent) {
          session.endSession();
          return;
        }
        info("Transaction committed ExcelData Farms");
        session.endSession();
      })
      .catch(err => {
        errorLogger(`Transaction aborted ExcelData Farms at ${index}\n`, err);
        session.endSession();
        // next will log the error
        return next(err);
      });
  } catch (err) {
    next(err);
  }
};

export const parseExcelFileAndExtractRequests: ExpressFunc = (
  req,
  res,
  next
) => {
  try {
    if (!req.headers["content-type"])
      return res.status(HttpStatus.BAD_REQUEST).send({
        error: "Invalid file",
        code: "invalid_upload_file"
      });

    const bb = Busboy({ headers: req.headers });
    const workbook = new Excel.Workbook();

    bb.on("file", async (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      try {
        // Log start
        LoggerService.Create({
          userId: res.locals.user.userId,
          action: req.method as string,
          resource: req.originalUrl,
          type: "info",
          payload: {
            name: "Add requests endpoint",
            file: `File [${name}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`
          },
          userAgent: req.get("user-agent") ?? "unknown"
        });
        // allow only excel files
        if (
          mimeType !==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: "Invalid file",
            code: "invalid_upload_file"
          });

        await workbook.xlsx.read(file);
        const ws = workbook.getWorksheet(1);
        const data: Array<Record<string, unknown>> = [];

        const crops = new Map<string, string | null>();

        if (!ws) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: "Empty excel sheet! Couldn't get worksheet",
            error: "excel.empty"
          });
        }

        // Loop over rows that have values in them.
        await new Promise(resolve => {
          let rowCounter = 0;
          // eachRow is not async, needs to be wrapped in a promise
          ws.eachRow(async (row, rowNum) => {
            if (rowNum === 1 || row.actualCellCount < 1) return; // ignore head and empty values
            if (!row.hasValues) return;
            const items = getVarieties(
              row.getCell(18).value as unknown as string,
              row.getCell(19).value as unknown as string
            );

            let crop: string | null;

            if (crops.has(row.getCell(16).value as unknown as string)) {
              crop = crops.get(
                row.getCell(16).value as unknown as string
              ) as string;
            } else {
              const foundCrop = await CropModel.findOne({
                $or: [
                  { name_ar: row.getCell(16).value as unknown as string },
                  { code: row.getCell(16).value as unknown as string }
                ]
              });
              if (foundCrop) {
                crops.set(
                  row.getCell(16).value as unknown as string,
                  foundCrop._id
                );
                crop = foundCrop._id;
              } else {
                crop = null;
                crops.set(
                  row.getCell(16).value as unknown as string,
                  row.getCell(16).value as unknown as string
                );
              }
            }

            const gov = await LocationModel.findOne({
              name_ar: row.getCell(13).value as unknown as string
            });

            const center = await LocationModel.findOne({
              name_ar: row.getCell(14).value as unknown as string,
              parent: gov?._id
            });

            const hamlet = await LocationModel.findOne({
              name_ar: row.getCell(15).value as unknown as string,
              parent: center?._id
            });

            let date = row.getCell(2).value as unknown as string;
            // check if date of format mm/dd/yyyy
            if (new Date(date).toString() !== "Invalid Date")
              // format to dd/mm/yyyy
              date = new Date(date).toLocaleDateString("en-GB");

            data.push({
              index: rowNum,
              dayOfWeek: row.getCell(1).value as unknown as string,
              date,
              mahaseelEngineer: row.getCell(3).value as unknown as string,
              plantQuarantineEngineer: row.getCell(4)
                .value as unknown as string,
              visitDetails: row.getCell(5).value as unknown as string,
              sampleNumber: row.getCell(6).value as unknown as string,
              inputCode: row.getCell(7).value as unknown as string,
              farmName: row.getCell(8).value as unknown as string,
              owner: row.getCell(9).value as unknown as string,
              ownerPhone: row.getCell(10)?.value
                ? getPhone((row.getCell(10).value as string).toString())
                : (null as unknown as string),
              representative: row.getCell(11).value as unknown as string,
              representativePhone: row.getCell(12)?.value
                ? getPhone((row.getCell(12).value as string).toString())
                : (null as unknown as string),
              // WARN: SET THESE TO NULL IF NOT FOUND, DON'T USE ? OPERATOR!
              governorate: gov ? gov._id : null,
              center: center ? center._id : null,
              hamlet: hamlet ? hamlet._id : null,
              crop: crop ? crop : null,
              totalArea: row.getCell(17).value as unknown as string,
              varieties: items.varieties,
              area: items.area,
              season: row.getCell(20).value as unknown as string
            });
            rowCounter++;
            if (rowCounter === ws.actualRowCount - 1) resolve(true);
          });
        }).catch(err => {
          // Note: this will only catch errors in the promise chain!
          return next(err);
        });

        return res.status(HttpStatus.OK).json({
          message: ErrorMessage.SUCCESS_ACTION,
          length: data.length,
          // sort by index
          data: data.sort(
            (a, b) =>
              (a as { index: number }).index - (b as { index: number }).index
          )
        });
      } catch (err) {
        return next(err);
      }
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (req.rawBody) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bb.end(req.rawBody);
    } else {
      req.pipe(bb);
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @function generateExcelTemplate
 * @description Generates a template excel file using cropId for bulk upload
 * Adds Locations as 3 dropdowns to the template in sheet 2 to appear in sheet 1
 * Needs to filter using each dropdown
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 * @param {NextFunction} next Express Next Function
 */
export const generateExcelTemplate: ExpressFunc = async (req, res, next) => {
  try {
    const workbook = new Excel.Workbook();
    workbook.addWorksheet("Sheet 1");

    const crop = await CropModel.findById(req.params.cropId);

    // add filter to sheet 1
    const sheet1 = workbook.getWorksheet(1);

    if (!sheet1) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: "Empty excel sheet! Couldn't get worksheet",
        error: "excel.empty"
      });
    }

    // set it to rtl
    sheet1.views = [{ state: "normal", rightToLeft: true }];

    sheet1.columns = [
      { header: "اليوم", key: "dayOfWeek", width: 14 },
      { header: "التاريخ", key: "date", width: 20 },
      { header: "مهندس محاصيل", key: "mahaseelEngineer", width: 20 },
      {
        header: "مهندس الحجر الزراعي",
        key: "plantQuarantineEngineer",
        width: 24
      },
      { header: "تفاصيل الزيارة", key: "visitDetails", width: 20 },
      { header: "رقم العينة", key: "sampleNumber", width: 10 },
      { header: "كود المدخلات", key: "inputCode", width: 20 },
      { header: "اسم المزرعة", key: "farmName", width: 20 },
      { header: "المالك", key: "owner", width: 20 },
      {
        header: "هاتف المالك",
        key: "ownerPhone",
        width: 20
      },
      { header: "المندوب", key: "representative", width: 20 },
      {
        header: "هاتف المندوب",
        key: "representativePhone",
        width: 24
      },
      { header: "المحافظة", key: "governorate", width: 20 },
      { header: "المركز", key: "center", width: 20 },
      { header: "العنوان", key: "hamlet", width: 20 },
      { header: "المحصول", key: "crop", width: 20 },
      { header: "المساحة الكلية", key: "totalArea", width: 20 },
      { header: "الأصناف", key: "varieties", width: 20 },
      { header: "المساحة", key: "area", width: 20 },
      { header: "الموسم", key: "season", width: 20 }
    ];

    // set headers style to bold and first 6 rows to be #92d050 background
    // and rest to be #b4c7e7 background
    const headersRow = sheet1.getRow(1);
    headersRow.font = { bold: true };
    headersRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "b4c7e7" }
    };

    const letters = ["A", "B", "C", "D", "E", "F"];
    for (const letter of letters) {
      headersRow.getCell(letter).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "92d050" }
      };
    }

    const valuesRow = sheet1.getRow(2);
    const cropColumn = valuesRow.getCell("P");
    valuesRow.getCell("E").value = "زيارة أولى";
    // Get current Year
    valuesRow.getCell("T").value = new Date().getFullYear();

    valuesRow.getCell("A").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"السبت,الاحد,الاثنين,الثلاثاء,الاربعاء,الخميس,الجمعة"']
    };
    // format date to be MM/DD/YYYY
    valuesRow.getCell("B").value = new Date().toLocaleDateString("en-US");

    // add crop name to header
    cropColumn.value = crop?.name_ar;

    // Save workbook to file
    const buffer = await workbook.xlsx.writeBuffer();

    res.type("excel");
    res.setHeader("Content-Disposition", "attachment; filename=template.xlsx");
    // send result buffer, wrapped in a Promise due to firefunctions
    return new Promise<void>(resolve => {
      res.writeHead(HttpStatus.OK);
      res.end(buffer, () => {
        resolve();
      });
    });
  } catch (err) {
    next(err);
  }
};

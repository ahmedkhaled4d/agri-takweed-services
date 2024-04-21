import { maybeRtlize } from "../utils/arabic.pdf.utils";

export const Messages = {
  FCM: {
    notifyForAcceptRequest:
      "تم اصدار شهاده التكويد ✅ عميلنا العزيز يمكنك تحميل الشهادة من داخل التطبيق"
  }
};

// Include date in format of hh:mm:ss dd/mm/yyyy, use getUTCDate() to get the date in UTC
const formatDateToHhMmSsDdMmYyyy = (date: Date) =>
  `${
    date.getUTCHours() + 2
  }:${date.getUTCMinutes()}:${date.getUTCSeconds()} ${date.getUTCDate()}/${date.getUTCMonth()}/${date.getUTCFullYear()}`;

export const gpxFlags = {
  BAD_AREA: "BAD_AREA",
  REQUEST_NOT_FOUND: "REQUEST_NOT_FOUND",
  DATE_NOT_GRABBED: "DATE_NOT_GRABBED",
  DATE_GRABBED: "DATE_GRABBED",
  UNKNOWN_CODE: "UNKNOWN_CODE",
  SYSTEM_COULD_NOT_PROCESS: "SYSTEM_COULD_NOT_PROCESS",
  MISSING_FIRST_POINT_OR_INVALID_GPX: "MISSING_FIRST_POINT_OR_INVALID_GPX",
  DUPLICATE_NAME_AR: "DUPLICATE_PART_NAME",
  MISSING_VARIETIES: "MISSING_VARIETIES",
  MISSING_POLYGON_NAME: "MISSING_POLYGON_NAME",
  MISSING_POLYGON_POINTS: "MISSING_POLYGON_POINTS",
  LOW_POLYGON_POINTS: "LOW_POLYGON_POINTS",
  MISSING_POLYGON_AREA: "MISSING_POLYGON_AREA",
  MISSING_CODE: "MISSING_CODE",
  INVALID_DATE: "INVALID_DATE",
  // First and last date of points
  FIRST_POINT_DATE: "FIRST_POINT_DATE",
  LAST_POINT_DATE: "LAST_POINT_DATE"
} as const;

export const gpxMessages = {
  BAD_AREA: (point: string, area: unknown) =>
    maybeRtlize(`المساحة غير صحيحة للقطعة ${point} وهي ${area}`),
  REQUEST_NOT_FOUND: "الطلب غير موجود",
  DATE_NOT_GRABBED: "لم يتم الحصول على التاريخ",
  DATE_GRABBED: "تم الحصول على التاريخ",
  UNKNOWN_CODE: "الكود غير صحيح للنظام",
  SYSTEM_COULD_NOT_PROCESS: "لا يمكن معالجة البيانات الواردة بشكل صحيح",
  MISSING_FIRST_POINT_OR_INVALID_GPX:
    "الملف غير صحيح أو لا يحتوي على النقطة الأولى",
  DUPLICATE_NAME_AR: "اسم النقطة متكرر",
  MISSING_VARIETIES: "الأصناف غير موجودة",
  MISSING_POLYGON_NAME: "اسم القطعة غير موجود",
  MISSING_POLYGON_POINTS: "النقاط غير موجودة",
  LOW_POLYGON_POINTS: "النقاط غير كافية",
  MISSING_POLYGON_AREA: "المساحة غير موجودة",
  MISSING_CODE: "الكود غير موجود",
  MISSING_DATE: "التاريخ غير موجود",
  LAST_POINT_DATE: (date?: Date) =>
    date ? formatDateToHhMmSsDdMmYyyy(date) : "لا يوجد",
  FIRST_POINT_DATE: (date?: Date) =>
    date ? formatDateToHhMmSsDdMmYyyy(date) : "لا يوجد"
} as const;

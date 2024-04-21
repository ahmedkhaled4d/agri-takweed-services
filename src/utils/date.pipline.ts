// module.exports.DateStringArabic = (date) => {
//     var months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو",
//         "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
//     ];
//     var days = ["اﻷحد", "اﻷثنين", "الثلاثاء", "اﻷربعاء", "الخميس", "الجمعة", "السبت"];
//     return days[date.getDay()] + ', ' + date.getDate() + ' ' + months[date.getMonth()] + ', ' + date.getFullYear(); }

export const dateStringArabic = (date: Date) => {
  return (
    dayStringArabic(date) +
    reverseString(date.getDate() + "") +
    " " +
    monthStringArabic(date) +
    reverseString(date.getFullYear() + "")
  );
};

/**
 * @param {string} s the string to reverse
 * @return {string} String reversed
 */
export function reverseString(s: string): string {
  return s.split("").reverse().join("");
}

const dayStringArabic = (date: Date) => {
  const days = [
    "اﻷحد",
    "اﻷثنين",
    "الثلاثاء",
    "اﻷربعاء",
    "الخميس",
    "الجمعة",
    "السبت"
  ];
  return days[date.getDay()];
};

const monthStringArabic = (date: Date) => {
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "إبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر"
  ];
  return months[date.getMonth()];
};

export function countDaysBetween(start: Date, end: Date): number {
  const millisecondsPerDay = 86400000;
  const startMilliseconds = start.getTime();
  const endMilliseconds = end.getTime();
  const diffMilliseconds = Math.abs(endMilliseconds - startMilliseconds);
  const diffDays = Math.ceil(diffMilliseconds / millisecondsPerDay);
  return diffDays;
}

export function isValidDate(unknownDate: unknown): unknownDate is Date {
  const testVar = new Date(unknownDate as string);
  return (
    unknownDate !== null &&
    testVar.toString() !== "Invalid Date" &&
    !isNaN(testVar.getTime())
  );
}

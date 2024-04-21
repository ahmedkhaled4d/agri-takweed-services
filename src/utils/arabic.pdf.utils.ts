import * as Twitter from "twitter_cldr";

const isArabic = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

const reverseText = (text: string): string => {
  return (
    reorderVisually(text)
      // .replaceAll("/", "ForwardSlashSign")
      .replaceAll("(", "leftBracketSign")
      .replaceAll(")", "rightBracketSign")
      .replaceAll("leftBracketSign", ")")
      .replaceAll("rightBracketSign", "(")
      .replaceAll("ForwardSlashSign", "/")
      .split("")
      .reverse()
      .join("")
  );
};

export const maybeRtlize = (text: string): string => {
  if (isArabic(text)) {
    return reverseText(text);
  }
  return text;
};

export const reorderVisually = (
  text: string,
  direction: "ltr" | "rtl" = "rtl"
): string => {
  const TwitterCldr = Twitter.load("ar");
  const bidiText = TwitterCldr.Bidi.from_string(text, { direction });
  bidiText.reorder_visually();
  return bidiText.toString();
};

// console.log(reorderVisually("مرحبا", "rtl")); // "باحرم"
// console.log(reorderVisually("Hello, مرحبا", "rtl")); // "مرحبا ,Hello"
// console.log(reorderVisually("Hello, مرحبا", "ltr")); // "Hello, مرحبا"

/**
 * @description this function takes a phone number and returns it in the correct format. It returns it with 0 at the start
 * Removes any spaces or dashes from the phone number, as well as any parentheses or plus signs. Used to get Egyptian Phones only!
 * @param {string} value - phone number
 * @returns {string} - phone number with 0 at the start.
 */
export function getPhone(value: string): string {
  // check if phone starts with 0 or +20 or 20, if it doesn't add 0 at the start
  if (value.match(/^0/)) return value;
  else if (value.match(/^\+20/)) return value.replace(/^\+20/, "0");
  else if (value.match(/^20/)) return value.replace(/^20/, "0");
  return `0${value}`;
}

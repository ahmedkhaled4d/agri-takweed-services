export const generateTimeStamp = () => {
  return Date.now().toString();
};

export const generateNumberTimeStamp = () => {
  return Date.now();
};

export function isCode(num: string | number) {
  return num.toString().length === 10;
}

export const getLngAndLatFromGoogleMapsUrl = (url: string) => {
  const cords = url.split("?q=")[1].split(",");
  return {
    lat: cords[0],
    lng: cords[1]
  };
};

// Returns date in format DD/MM/YYYY
export function getFormattedDate(d = new Date()) {
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()]
    .map(n => (n < 10 ? `0${n}` : `${n}`))
    .join("/");
}

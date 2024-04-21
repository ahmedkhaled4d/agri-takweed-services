import { Point } from "../types";

export function roundToTwo(num: number) {
  return +(Math.round((num + "e+2") as unknown as number) + "e-2");
}

export function convertToRadianFromDegree(input: number) {
  return input * (Math.PI / 180);
}

export function convertToDegreeFromRadian(input: number) {
  return input * (180 / Math.PI);
}

export function isValidLat(lat: number | unknown) {
  // The latitude must be a number between -90 and 90
  return isValidNumber(lat) && isFinite(lat) && Math.abs(lat) <= 90;
}
export function isValidLng(lng: number | unknown) {
  // The longitude must be a number between -180 and 180.
  return isValidNumber(lng) && isFinite(lng) && Math.abs(lng) <= 180;
}

export function isValidLatAndLng(obj: { lat: number; lng: number }) {
  if (!isValidLat(obj.lat)) return false;
  if (!isValidLng(obj.lng)) return false;
  return true;
}

// Checks if number
export function isNumeric(num: string | number) {
  return /^-?\d+$/.test(num.toString());
}

/**
 * @description Check if the input is a valid number (not NaN). Doesn't check if the number is positive or negative, infinity or not.
 * @param {number} input
 * @return {boolean}
 */
export function isValidNumber(input: unknown): input is number {
  // whats the point of this check??
  if (typeof input === "number") {
    return !isNaN(input);
  }
  return !isNaN(Number(input));
}

export const isPositiveNumber = (num: unknown): num is number => {
  return Number(num) > 0 && Number(num) !== Infinity;
};

export function isPositiveNumberOrZero(num: unknown): num is number {
  if (Number(num) === 0) return true;
  return isPositiveNumber(num);
}

/**
 * @author Mina Sameh
 * @description Gets center point, if not found or array too small returns first point
 * @param {[Point]} points Array of lat and lng cords
 * @return {Point | null} Returns center point or First point(in case of array too small) or null if no array found.
 * @see https://stackoverflow.com/questions/6671183/calculate-the-center-point-of-multiple-latitude-longitude-coordinate-pairs
 * @see The post I got the answer from: https://stackoverflow.com/a/30033564
 */
export function getCenterPoint(points: Array<Point> | null): Point | null {
  if (!points) return null;
  if (points.length < 2) return points[0];
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (let i = 0; i < points.length; i++) {
    const lat = convertToRadianFromDegree(points[i].lat);
    const lng = convertToRadianFromDegree(points[i].lng);
    // sum of cartesian coordinates
    sumX += Math.cos(lat) * Math.cos(lng);
    sumY += Math.cos(lat) * Math.sin(lng);
    sumZ += Math.sin(lat);
  }

  const avgX = sumX / points.length;
  const avgY = sumY / points.length;
  const avgZ = sumZ / points.length;

  // convert average x, y, z coordinate to latitude and longtitude
  const lng = Math.atan2(avgY, avgX);
  const hyp = Math.sqrt(avgX * avgX + avgY * avgY);
  const lat = Math.atan2(avgZ, hyp);

  return {
    lat: convertToDegreeFromRadian(lat),
    lng: convertToDegreeFromRadian(lng)
  };
}

export const getDistanceLngAndLat = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Radius of the earth in kilometers
  const dLat = convertToRadianFromDegree(lat2 - lat1);
  const dLon = convertToRadianFromDegree(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(convertToRadianFromDegree(lat1)) *
      Math.cos(convertToRadianFromDegree(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in KM
};

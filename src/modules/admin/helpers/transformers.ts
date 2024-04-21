import { isValidObjectId } from "mongoose";
import { ObjectId } from "../../../helpers";
import { BodyError } from "../../../utils";

/**
 * Transforms an array or string of governorate IDs to an array of ObjectIds.
 * @param {[string] | string} governorates - An array or string of governorate IDs.
 * @return {[ObjectId]} An array of ObjectIds.
 * @throws BodyError if an invalid governorate ID is found.
 */
export const transformGovernorates = (governorates: Array<string> | string) => {
  if (typeof governorates === "string") {
    if (!isValidObjectId(governorates)) {
      throw new BodyError("Invalid governorate id");
    }
    return [ObjectId(governorates)];
  }

  if (!Array.isArray(governorates)) {
    throw new BodyError("Invalid governorate id, must be an array or string");
  }

  return governorates.map(governorate => {
    if (!isValidObjectId(governorate)) {
      throw new BodyError("Invalid governorate id, must be a valid ObjectId");
    }
    return ObjectId(governorate);
  });
};

/**
 * Transforms an array or string of crop IDs to an array of ObjectIds.
 * @param {[string]| string} crops - An array or string of crop IDs.
 * @return {[ObjectId]} An array of ObjectIds.
 * @throws BodyError if an invalid crop ID is found.
 */
export const transformCrops = (crops: Array<string> | string) => {
  if (typeof crops === "string") {
    if (!isValidObjectId(crops)) {
      throw new BodyError("Invalid crop id");
    }
    return [ObjectId(crops)];
  }

  if (!Array.isArray(crops)) {
    throw new BodyError("Invalid crop id, must be an array or string");
  }
  return crops.map(crop => {
    if (!isValidObjectId(crop)) {
      throw new BodyError("Invalid crop id, must be a valid ObjectId");
    }
    return ObjectId(crop);
  });
};

/**
 * Transforms an array or string or number of season numbers to an array of numbers.
 * @param {[string] | string | number | [number]} seasons - An array or string of season numbers.
 * @return {[number]} An array of numbers.
 * @throws BodyError if an invalid season number is found.
 */
export const transformSeasons = (
  seasons: Array<string> | string | Array<number> | number
): Array<number> => {
  if (typeof seasons === "string" || typeof seasons === "number") {
    if (isNaN(Number(seasons))) {
      throw new BodyError("Invalid season number");
    }
    return [Number(seasons)];
  }

  if (!Array.isArray(seasons)) {
    throw new BodyError(
      "Invalid season number, must be an array or string or number"
    );
  }

  return seasons.map(season => {
    // Check if the season is a number
    if (isNaN(Number(season))) {
      throw new BodyError("Invalid season number");
    }
    return Number(season);
  });
};

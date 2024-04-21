import mongoose from "mongoose";

export function escapeString(str: string): string {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export const ObjectId = (item: string | mongoose.Types.ObjectId) => {
  return new mongoose.Types.ObjectId(item);
};

/**
 * @description Checks if string is a valid mongoDB object id
 * @param {string} id
 * @return {boolean} Returns true if valid mongoDB object id
 * @see https://stackoverflow.com/questions/11985228/mongodb-node-check-if-objectid-is-valid
 */
export function isObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

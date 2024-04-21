import jwt from "jsonwebtoken";
import { JWT_SECRET_TAKWEED as JWT_SECRET } from "../../../config";
import { jwtTokenPayload } from "../../../types";
import { Types } from "mongoose";

export const JwtSign = (
  data: { _id: string | Types.ObjectId; role: string },
  expiresIn: "1d" | "10d" | "1y" | undefined = undefined
) =>
  jwt.sign({ userId: data._id, role: data.role }, JWT_SECRET, {
    expiresIn: expiresIn ?? "1y"
  });

/*
 * Takes JWT and verifys
 * @param {string} token
 */
export function verifyJwt(token: string) {
  if (!token) {
    return {
      err: "No token provided",
      value: null
    };
  }
  const Token = token.split(" ").length > 1 ? token.split(" ")[1] : token;
  try {
    const value = jwt.verify(Token, JWT_SECRET);
    return {
      err: null,
      value: value as jwtTokenPayload
    };
  } catch (err: unknown) {
    return {
      err: err,
      value: null
    };
  }
}

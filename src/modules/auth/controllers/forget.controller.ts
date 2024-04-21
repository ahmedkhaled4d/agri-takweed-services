import { Request, Response, NextFunction } from "express";
import { JwtSign, verifyJwt } from "../services/jwt.service";
import { OTPModel, UserModel } from "../../../models";
import * as hashing from "../services/hashing.service";
import { ErrorMessage, ErrorCode } from "../../../assets/errors";
import * as SMSService from "../services/otp.services";
import { HttpStatus } from "../../../assets/httpCodes";
import { HttpError } from "../../../utils/error";

/**
 * this method for asking server to send OTP by finding user phone number
 * @STATUS: NOT_COMPLEATED
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone } = req.body;
    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: ErrorCode.INVALID_PHONE,
        message: ErrorMessage.INVALID_PHONE
      });
    }
    // Check if the user already got sent OTP token.
    const phoneOtp = await OTPModel.findOne({ phone });
    if (phoneOtp)
      throw new HttpError(
        "Already Sent OTP, pls wait for 2ms",
        HttpStatus.CONFLICT
      );
    const smsResult = await SMSService.sendOTP(user.phone);
    if (smsResult?.status === 201) {
      // don't block
      OTPModel.create({
        phone: phone
      });
      return res.status(HttpStatus.CREATED).json({
        message: "We resend new OTP",
        phone: user.phone,
        checkCode: smsResult?.data?.checkCode
      });
    } else {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: "send.OTP",
        message: smsResult
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * this method for chnaging user password by sending his valid phone number
 * @STATUS : Done
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;
    const token = req.headers["authorization"];
    if (!token) {
      return res
        .status(400)
        .json({ message: ErrorMessage.REQUIRES_BEARER_TOKEN });
    }
    const { value } = verifyJwt(token);
    if (!value) {
      return res.status(400).json({ message: ErrorMessage.MALFORMED_TOKEN });
    }
    const user = await UserModel.findById(value.userId);
    if (!user) {
      return res.status(403).json({ message: ErrorMessage.INVALID_PHONE });
    }
    user.password = await hashing.hashPassword(password);
    const accessToken = JwtSign(user);
    await user.save();
    return res.status(200).json({
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        tradeId: user.tradeId,
        nationalId: user.nationalId,
        role: user.role
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

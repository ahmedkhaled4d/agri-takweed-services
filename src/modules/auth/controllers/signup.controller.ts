import { Request, Response, NextFunction } from "express";
import { UserModel, UserDocument } from "../../../models";
import * as hashing from "../services/hashing.service";
import * as SMSService from "../services/otp.services";
import * as IDService from "../services/ID.services";
import { ErrorMessage, ErrorCode } from "../../../assets/errors";
import { HttpError } from "../../../utils/error";
import { HttpStatus } from "../../../assets/httpCodes";
import { ExpressFunc } from "../../../types";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nationalId, phone } = req.body;
    // Check if user exists
    const searchUser = (await UserModel.findOne({
      phone,
      role: "client"
    })) as UserDocument;
    if (searchUser) {
      throw new HttpError(ErrorMessage.PHONE_REGISTERD, HttpStatus.CONFLICT);
    }

    const user = new UserModel(req.body);
    user.password = await hashing.hashPassword(req.body.password);
    // TODO: save user
    await user.save();

    // TODO: send OTP
    const smsResult = await SMSService.sendOTP(user.phone);
    res.status(201).json({
      message: "User account is created and we Send OTP",
      phone: user.phone,
      checkCode: smsResult?.data?.checkCode // Didnt send?
    });

    // TODO: check nationalId
    if (nationalId) {
      user.nid = (await IDService.verify(nationalId)) as Record<
        string,
        unknown
      >;
    }

    // TODO: update nID
    await user.save();
  } catch (error) {
    next(error);
  }
};

export const signupAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, phone } = req.body;
    let user = await UserModel.findOne({ phone, role: "admin" });
    if (user)
      return res.status(409).json({
        error: ErrorCode.PHONE_REGISTERD,
        message: ErrorMessage.PHONE_REGISTERD
      });

    const hashedPassword = await hashing.hashPassword(password);
    user = new UserModel({
      name,
      email,
      phone,
      otpVerified: true,
      password: hashedPassword,
      role: "admin"
    });

    await user.save();
    return res.status(201).json({
      message: "admin account is created",
      phone: user.phone
    });
  } catch (error) {
    next(error);
  }
};

export const addEng: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.body.password || !req.body.name || !req.body.phone)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS, error: true });
    const password = await hashing.hashPassword(req.body.password);
    const result = await UserModel.create({
      ...req.body,
      password: password,
      otpVerified: true,
      role: "engineer"
    });
    if (result)
      return res
        .status(HttpStatus.CREATED)
        .json({ message: "Eng account is created.", phone: result.phone });
    return res
      .status(HttpStatus.CONFLICT)
      .json({ message: "something went wrong...." });
  } catch (err) {
    next(err);
  }
};

import { Request, Response, NextFunction } from "express";
import { UserModel } from "../../../models";
import * as hashing from "../services/hashing.service";
import { ErrorMessage, ErrorCode } from "../../../assets/errors";
import * as SMSService from "../services/otp.services";
// import * as mailService from "../services/mail.service";
import { JwtSign } from "../services/jwt.service";

const maxAge = 24 * 60 * 60 * 1000; // 1 day

const setLoginCookie = (
  res: Response,
  accessToken: string,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  scheme: string
) => {
  const isSecure = scheme === "https";
  res
    .cookie("access_token", accessToken, {
      maxAge,
      httpOnly: true,
      secure: isSecure,
      signed: true
    })
    .cookie("check_token", true, {
      maxAge,
      secure: isSecure,
      signed: true
    });
};

const setLogoutCookie = (res: Response) =>
  res
    .cookie("access_token", "", { maxAge: 0 })
    .cookie("check_token", true, { maxAge: 0 });

export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { checkCode, phone, pincode, fcm } = req.body;
    const user = await UserModel.findOne({ phone });
    if (!user)
      return res.status(403).json({
        error: ErrorCode.INVALID_PHONE,
        message: ErrorMessage.INVALID_PHONE
      });

    const checkOTPResult = await SMSService.checkOTP(pincode, checkCode);

    if (checkOTPResult?.data.otpPasscodeStatus === 1) {
      const accessToken = JwtSign(user);
      user.otpVerified = true;
      user.fcm = fcm;
      await user.save();
      // await mailService.send(
      //   user.email,
      //   `Notification - new user has been registered`,
      //   `Hi there , we have a new client  : ${user.email} , <br> phone number :  ${user.phone}`
      // );

      return res.status(200).json({
        data: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          tradeId: user.tradeId,
          nationalId: user.nationalId,
          permissions: user.permissions,
          role: user.role
        },
        accessToken
      });
    }
    return res
      .status(400)
      .json({ error: ErrorCode.OTP_NOT_VERIFIED, message: checkOTPResult });
  } catch (error) {
    next(error);
  }
};

export const loginByPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone, password, fcm } = req.body;
    const user = await UserModel.findOne({
      $or: [{ role: "client" }, { role: "engineer" }],
      phone
    });
    if (!user) {
      return res.status(403).json({
        error: ErrorCode.INVALID_PHONE,
        message: ErrorMessage.INVALID_PHONE
      });
    }
    const validPassword = await hashing.validatePassword(
      password,
      user.password
    );
    if (!validPassword) {
      return res.status(403).json({
        error: ErrorCode.INVALID_CREDENTIALS,
        message: ErrorMessage.INVALID_CREDENTIALS
      });
    }
    if (user.otpVerified !== true) {
      return res.status(403).json({
        error: ErrorCode.OTP_NOT_VERIFIED,
        message: ErrorMessage.OTP_NOT_VERIFIED
      });
    }
    if (fcm && user.fcm !== fcm) {
      user.fcm = fcm;
      await user.save();
    }
    const accessToken = JwtSign(user);
    setLoginCookie(
      res,
      accessToken,
      req.headers["x-forwarded-proto"]?.toString() || req.protocol
    );
    return res.status(200).json({
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        tradeId: user.tradeId,
        nationalId: user.nationalId,
        role: user.role,
        permissions: user.permissions,
        reviewer: user.reviewer
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const loginByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({
      $or: [{ role: "admin" }, { role: "hagr" }],
      email
    });
    if (!user)
      return res.status(403).json({
        error: ErrorCode.INVALID_EMAIL,
        message: ErrorMessage.INVALID_EMAIL
      });

    const validPassword = await hashing.validatePassword(
      password,
      user.password
    );
    if (!validPassword) {
      return res.status(403).json({
        error: ErrorCode.INVALID_CREDENTIALS,
        message: ErrorMessage.INVALID_CREDENTIALS
      });
    }
    const accessToken = JwtSign(user, "1d");
    if (req.body.fcm && user.fcm !== req.body.fcm) {
      user.fcm = req.body.fcm;
      await user.save();
    }
    setLoginCookie(
      res,
      accessToken,
      req.headers["x-forwarded-proto"]?.toString() || req.protocol
    );

    return res.status(200).json({
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        tradeId: user.tradeId,
        nationalId: user.nationalId,
        permissions: user.permissions,
        role: user.role
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response, next: NextFunction) => {
  try {
    setLogoutCookie(res);
    return res.status(200).json({ message: "logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const checkCookie = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.user)
      return res.status(401).json({ message: "Unauthorized" });
    return res.status(200).json({
      data: {
        _id: res.locals.user.userId,
        role: res.locals.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

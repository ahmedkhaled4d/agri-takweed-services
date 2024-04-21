import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { escapeString, isObjectId } from "../../../helpers";
import { LocationModel } from "../../../models";
import { ExpressFunc } from "../../../types";
import { searchCenterAgg, searchHameltAgg } from "../aggregations";

export const Governorates = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await LocationModel.find({
      type: "governorate",
      parent: null
    })
      .select({
        parent: 0
      })
      .lean()
      .populate({ path: "adminData", select: "name" })
      .exec();
    if (!data) {
      return res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const Centers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const governorateid = req.params.governorateid;
    if (!isObjectId(governorateid))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid ObjectId" });
    console.log(governorateid);
    const data = await LocationModel.find({
      type: "center",
      parent: new mongoose.Types.ObjectId(governorateid)
    })
      .select({
        parent: 0
      })
      .lean()
      .populate({ path: "adminData", select: "name" })
      .exec();
    if (!data) {
      return res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const Hamlets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const centerid = req.params.centerid;
    if (!isObjectId(centerid))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid ObjectId" });
    const data = await LocationModel.find({
      type: "hamlet",
      parent: new mongoose.Types.ObjectId(centerid)
    })
      .select({
        parent: 0
      })
      .populate({ path: "adminData", select: "name" })
      .lean()
      .exec();
    if (!data) {
      return res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });
    }
    return res.status(HttpStatus.OK).json({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params.id)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Missing Param ID!" });
    const location = await LocationModel.findById(req.params.id)
      .populate({ path: "adminData", select: "name" })
      .lean()
      .exec();
    if (location) return res.json({ data: location });
    return res
      .status(HttpStatus.NOT_FOUND)
      .json({ message: "No resource Found" });
  } catch (err) {
    next(err);
  }
};

export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;

    if (!isObjectId(Id))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid ObjectId" });

    const data = await LocationModel.findByIdAndUpdate(Id, req.body, {
      lean: true,
      new: true
    });
    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(HttpStatus.OK).json({
      data: data
    });
  } catch (error) {
    next(error);
  }
};

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name_ar, name_en, code, type, parent, coordinates } = req.body;
    if (!name_ar || !name_en || !code || !type)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });

    const data = await LocationModel.create({
      // NOTE: This is not a whitespace character!!!!
      // its no break space (UA00+1), replace it with normal space
      name_ar: name_ar.replaceAll(" ", " ").trimStart().trimEnd(),
      name_en: name_en.replaceAll(" ", " ").trimStart().trimEnd(),
      code,
      type,
      parent,
      coordinates,
      adminData: res.locals.user.userId
    });

    if (!data)
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    return res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

export const Delete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    if (!isObjectId(Id))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid ObjectId" });
    const data = await LocationModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(Id)
      },
      { lean: true }
    );
    if (!data) {
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }
    return res
      .status(HttpStatus.OK)
      .send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

export const Active = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    if (!isObjectId(Id))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid ObjectId" });
    const data = await LocationModel.findByIdAndUpdate(
      Id,
      { active: true },
      { new: true, lean: true }
    );
    return res.status(HttpStatus.OK).send({ data });
  } catch (error) {
    next(error);
  }
};

export const Deactive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Id = req.params.id;
    if (!isObjectId(Id))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid ObjectId" });
    const data = await LocationModel.findByIdAndUpdate(
      Id,
      { active: false },
      { new: true, lean: true }
    );
    return res.status(HttpStatus.OK).send({ data });
  } catch (error) {
    next(error);
  }
};

export const searchHamlet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await LocationModel.aggregate(
      searchHameltAgg(filterSearch(req.query))
    );
    return res.status(HttpStatus.OK).send({ data });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const searchCenter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await LocationModel.aggregate(
      searchCenterAgg(filterSearch(req.query))
    );
    return res.status(HttpStatus.OK).send({ data });
  } catch (error) {
    next(error);
  }
};

/**
 * @api {post} /location/getcenters Get Governorates
 * @description Only get centers using an array of governorates, used in pointsmap
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 * @return {Response} - Returns centers
 */
export const getCenters: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.body.governorates)
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: ErrorMessage.MISSING_PARAM
      });

    const data = await LocationModel.find(
      {
        type: "center",
        parent: { $in: req.body.governorates }
      },
      {
        name_ar: 1,
        name_en: 1,
        code: 1
      },
      {
        lean: true
      }
    );

    return res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
};

const filterSearch = (body: { name_ar?: string }) => {
  const filter: Record<string, Record<string, string | boolean>> = {};
  // if (body.center) {
  //   filter['center'] = { $eq: body.center };
  // }
  // if (body.hamlet) {
  //   filter['hamlet'] = { $eq: body.hamlet };
  // }

  if (body.name_ar) {
    filter["name_ar"] = { $regex: escapeString(body.name_ar) };
  }

  filter["active"] = { $eq: true };
  return filter;
};

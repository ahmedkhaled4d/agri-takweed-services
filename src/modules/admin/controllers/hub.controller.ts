import type { NextFunction, Request, Response } from "express";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { hubRepo } from "../../../repositories/hub.repository";
import HubService from "../services/domain/hub.service";
import { isValidLatAndLng } from "../../../utils";
import { escapeString } from "../../../helpers";

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hubRepo.find(
      filterSearch(req.query),
      req.limit,
      req.skip
    );

    if (!data)
      return res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });

    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hubRepo.findById(req.params.id);

    if (!data)
      res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });

    return res.send({ data });
  } catch (error) {
    next(error);
  }
};

// Update DATA Details
export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await hubRepo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      lean: true
    });

    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    await HubService.updateTraceabilityHubInfo(data);
    return res.status(HttpStatus.OK).json({ data: data });
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
    if (
      !req.body.type ||
      !req.body.subType ||
      !req.body.hubName ||
      !req.body.hubCode ||
      !req.body.location ||
      !isValidLatAndLng(req.body.location.cooredinate)
    )
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_OPERATION });
    const data = await hubRepo.Create(req.body);
    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(HttpStatus.OK).json({ data });
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
    const data = await hubRepo.findById(req.params.id);
    if (!data) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }

    const isUsed = await HubService.isUsed(data);

    if (isUsed && isUsed.length > 0)
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: "Hub is used!", usedBy: isUsed });

    await hubRepo.deleteOne(req.params.id);
    return res
      .status(HttpStatus.OK)
      .send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

export const GetHubsName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await hubRepo.getHubsNameOnly(filterSearch(req.query), {
      lean: true
    });

    if (!data)
      return res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });

    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

interface FilterType {
  hubCode?: string;
  hubName?: string;
  type?: string;
  subType?: string;
}

const filterSearch = (body: FilterType) => {
  const filter: Record<string, Record<string, string> | boolean> = {};

  if (!body) return filter;
  if (body.hubCode) filter["hubCode"] = { $eq: body.hubCode };
  if (body.hubName) filter["hubName"] = { $regex: escapeString(body.hubName) };
  if (body.type) filter["type"] = { $regex: escapeString(body.type) };
  if (body.subType) filter["subType"] = { $regex: escapeString(body.subType) };

  return filter;
};

import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import CommitteeModel, {
  CommitteeDoc
} from "../../../models/takweed/committee.model";
import { ExpressFunc } from "../../../types";
import {
  getDistanceLngAndLat,
  getLngAndLatFromGoogleMapsUrl,
  isPositiveNumber
} from "../../../utils";

export const List: ExpressFunc = async (req, res, next) => {
  try {
    const page = isPositiveNumber(req.headers.page)
      ? parseInt(req.headers.page.toString()) - 1
      : 0;
    const limit = 10;
    const skip = page * limit;
    const userId = res.locals.user.userId;
    const data = await CommitteeModel.find({
      $or: [{ hagrUser: userId }, { mahaseelUser: userId }]
    })
      .populate("mahaseelUser", "_id name")
      .populate("hagrUser", "_id name")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return res.status(200).json({ data: data });
  } catch (err) {
    next(err);
  }
};

export const One: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params._id)
      return res.status(400).json({ message: ErrorMessage.INVALID_PARAMS });
    const data: CommitteeDoc & {
      mahaseelUser: { name: string; _id: string };
      hagrUser: { name: string; _id: string };
    } = await CommitteeModel.findOne(req.params)
      .populate("mahaseelUser", "_id name")
      .populate("hagrUser", "_id name")
      .lean();
    if (
      data?.mahaseelUser._id.toString() !== res.locals.user.userId &&
      data?.hagrUser._id.toString() !== res.locals.user.userId
    )
      return res.status(401).json({ message: ErrorMessage.UNAUTHRIAZED });
    if (data) return res.status(200).json({ data: data });
    return res.status(404).json({ message: ErrorMessage.NO_CONTENT });
  } catch (err) {
    next(err);
  }
};

export const Update: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.params._id)
      return res.status(400).json({ message: ErrorMessage.INVALID_PARAMS });
    const committee = await CommitteeModel.findOne(req.params);
    if (!committee)
      return res.status(404).json({ message: ErrorMessage.NO_CONTENT });
    const userId = res.locals.user.userId;
    if (
      committee.mahaseelUser.toString() !== userId &&
      committee.hagrUser.toString() !== userId
    )
      return res.status(401).json({ message: ErrorMessage.UNAUTHRIAZED });
    if (req.body.farm) {
      const Farm = committee.farms.filter(
        farm => (farm._id as string).toString() === req.body.farm._id.toString()
      )[0];
      if (!Farm)
        return res.status(404).json({ message: ErrorMessage.NO_CONTENT });
      Farm.visit = req.body.farm.visit;
      committee.markModified("farms");
    }
    if (req.body.status) committee.status = req.body.status;
    await committee.save();
    return res.status(200).json({ data: committee });
  } catch (err) {
    next(err);
  }
};

export const sortComitteeFarms: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.query.lat || !req.query.lng)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });
    // const item = "http://maps.google.com?q=30.59822696261108,30.76467202976346"
    const data: CommitteeDoc & {
      mahaseelUser: { name: string; _id: string };
      hagrUser: { name: string; _id: string };
    } = await CommitteeModel.findOne(req.params)
      .populate("mahaseelUser", "_id name")
      .populate("hagrUser", "_id name")
      .lean();

    // Check if client or engineer in Committee.
    if (res.locals.user.role === "engineer") {
      const userId = res.locals.user.userId;
      if (
        data.mahaseelUser._id.toString() !== userId &&
        data.hagrUser._id.toString() !== userId
      )
        return res.status(401).json({ message: ErrorMessage.UNAUTHRIAZED });
    }
    const lat = Number(req.query.lat.toString());
    const lng = Number(req.query.lng.toString());
    data.farms.sort((first, second) => {
      // Get lang and latuide from link
      const firstCords = getLngAndLatFromGoogleMapsUrl(first.url);
      const secondCords = getLngAndLatFromGoogleMapsUrl(second.url);

      // Get difference between each one and the Lng lat sent
      const diffA = getDistanceLngAndLat(
        lat,
        lng,
        Number(firstCords.lat),
        Number(firstCords.lng)
      );
      const diffB = getDistanceLngAndLat(
        lat,
        lng,
        Number(secondCords.lat),
        Number(secondCords.lng)
      );

      // Return value depending on:
      if (diffA > diffB) {
        return 1;
      } else if (diffA < diffB) {
        return -1;
      } else {
        return 0; // same
      }
    });
    return res.status(200).json({ data: data });
  } catch (err) {
    next(err);
  }
};

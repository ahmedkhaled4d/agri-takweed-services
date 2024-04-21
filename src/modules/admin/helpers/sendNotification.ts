import { Types } from "mongoose";
import { UserModel, UserDocument } from "../../../models";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { HttpError } from "../../../utils";
import { sendByToken } from "../services";

export async function committeeSendNotification(
  mahaseelUserId: Types.ObjectId,
  hagrUserId: Types.ObjectId,
  message: string
): Promise<
  | {
      err: false;
    }
  | {
      err: true;
      reason: Error;
    }
> {
  try {
    const prResults = await Promise.allSettled<UserDocument | null>([
      UserModel.findOne(
        {
          _id: mahaseelUserId
        },
        { lean: true }
      ).exec(),

      UserModel.findOne(
        {
          _id: hagrUserId
        },
        { lean: true }
      ).exec()
    ]);

    const [mahaseelUser, hagrUser] = prResults.map(prResult => {
      if (prResult.status === "rejected") throw new Error(prResult.reason);
      return prResult.value;
    });

    if (!mahaseelUser || !hagrUser) {
      // techincally speaking this could happen
      // however it's not expected to happen
      // so we throw an error, to log it if it happens
      // Controller logs it and sends a 400 response
      return {
        err: true,
        reason: new HttpError(
          ErrorMessage.NO_USER_FOUND_IN_DB,
          HttpStatus.BAD_REQUEST
        )
      };
    }

    if (mahaseelUser?.fcm)
      sendByToken(mahaseelUser.fcm, message, {
        key: "screen",
        value: "inbox"
      });
    if (hagrUser?.fcm)
      sendByToken(hagrUser.fcm, message, {
        key: "screen",
        value: "inbox"
      });
    return {
      err: false
    };
  } catch (err) {
    return {
      err: true,
      reason: err as Error
    };
  }
}

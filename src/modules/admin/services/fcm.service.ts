import * as serviceAccount from "../../../config/serviceAccount.json";
import * as LoggerRepo from "../../../repositories/logger.repository";
import FCM from "fcm-node";
import { error, info } from "firebase-functions/logger";
const fcm = new FCM(serviceAccount);

export const sendByToken = (
  token: string,
  body: string,
  data: Record<string, string>
) => {
  const message = {
    // this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: token,
    // collapse_key: 'your_collapse_key',
    notification: {
      title: "تكويد",
      body: body
    },
    data
  };
  fcm.send(message, function (err: unknown, response: unknown) {
    if (err) {
      // log error to db
      LoggerRepo.Create({
        action: "sendByToken",
        type: "error",
        resource: "fcm.service",
        payload: { err, response }
      });
      error(err);
    } else {
      info(
        "Successfully sent with response: ",
        JSON.stringify(response, null, 2)
      );
    }
  });
};

export const SubscribeToTopic = (tokens = [], topic: string) => {
  fcm.subscribeToTopic(tokens, topic, (err: unknown, response: unknown) => {
    if (err) {
      // log error to db
      LoggerRepo.Create({
        action: "sendByToken",
        type: "error",
        resource: "fcm.service",
        payload: { err, response }
      });
      error(err);
    } else {
      info(
        "Successfully SubscribeToTopic  response: ",
        JSON.stringify(response, null, 2)
      );
    }
  });
};

export const UnsubscribeToTopic = (tokens = [], topic: string) => {
  fcm.unsubscribeToTopic(tokens, topic, (err: unknown, response: unknown) => {
    if (err) {
      // log error to db
      LoggerRepo.Create({
        action: "sendByToken",
        type: "error",
        resource: "fcm.service",
        payload: { err, response }
      });
      error(err);
    } else {
      info(
        "Successfully SubscribeToTopic  response: ",
        JSON.stringify(response, null, 2)
      );
    }
  });
};

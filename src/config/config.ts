import { Credentials } from "../types";

export function checkConfig() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_Secret!");
  }
  if (!process.env.FB_APP_SERVICE_ACCOUNT) {
    throw new Error("Missing FB_APP_SERVICE_ACCOUNT!");
  }
}

export const JWT_SECRET_TAKWEED = process.env.JWT_SECRET as string;
export const FB_APP_SERVICE_ACCOUNT = JSON.parse(
  process.env.FB_APP_SERVICE_ACCOUNT as string
) as Credentials;

// DEV or PRODUCTION
export const APP_ENV = process.env.APP_ENV ?? "PRODUCTION";

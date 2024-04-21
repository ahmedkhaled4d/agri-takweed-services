import { Request, Response } from "express";

// The actual endpoint is under request.controller.ts, I don't know why this file exists in the first place
export const verifyApp = async (_: Request, res: Response) => {
  res.redirect("https://play.google.com/store/apps/details?id=com.takweed.app");
};

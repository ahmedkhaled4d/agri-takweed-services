import request from "supertest";
// import { UserModel } from "../../../../models";

import AUTH_APP from "../../routes/index";
jest.mock("../../services/otp.services.ts");

const commonHeaders = {
  otptoken: process.env.OTP_TOKEN,
  "Content-Type": "application/json"
};

describe("Login Controller", () => {
  describe("Client", () => {
    const phoneNum = "+2011112313213";
    let otp = "";
    let checkCode = "";
    const password = "123456";

    afterAll(async () => {
      // await UserModel.findOneAndDelete({ phone: phoneNum });
    });

    // Client
    it("Should Register and send OTP", async () => {
      const res = await request(AUTH_APP)
        .post("/signup")
        .set(commonHeaders)
        .send({
          name: "test test",
          phone: phoneNum,
          password: password
        });
      console.log(res.body);
      expect(res.statusCode).toEqual(201);
      expect(res.body.error).toBeUndefined();
      expect(res.body.checkCode.CheckCode).toBeDefined();
      expect(res.body.checkCode.otpCode).toBeDefined();
      checkCode = res.body.checkCode.CheckCode;
      otp = res.body.checkCode.otpCode;
    });

    it("Should Fail Register", async () => {
      const res = await request(AUTH_APP)
        .post("/signup")
        .set(commonHeaders)
        .send({
          name: "test test",
          phone: phoneNum,
          password: password
        });
      console.log(res.body);
      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.checkCode).toBeUndefined();
    });

    it("Should Verify Otp", async () => {
      const res = await request(AUTH_APP)
        .post("/verify")
        .set(commonHeaders)
        .send({
          phone: phoneNum,
          pincode: otp,
          checkCode
        });
      console.log(res.body);
      expect(res.statusCode).toEqual(200);
      expect(res.body.error).toBeUndefined();
    });

    it("Should Login using pass", async () => {
      const res = await request(AUTH_APP)
        .post("/login")
        .set(commonHeaders)
        .send({
          phone: phoneNum,
          password
        });
      console.log(res.body);
      expect(res.statusCode).toEqual(200);
      expect(res.body.error).toBeUndefined();
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.data).toBeDefined();
    });
  });

  describe("Admin", () => {
    // Admin
    it("Should Fail on missing OTP Token Header", async () => {
      const res = await request(AUTH_APP)
        .post("/login/admin")
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .send({
          email: "whatever",
          password: "doesnt matter"
        });
      expect(res.statusCode).toEqual(401);
    });

    it("Admin Should Login", async () => {
      const res = await request(AUTH_APP)
        .post("/login/admin")
        .set("Accept", "application/json")
        .set("otptoken", process.env.OTP_TOKEN ?? "")
        .set("Content-Type", "application/json")
        .send({
          email: "admin@mail.com",
          password: "mahaseelAdmin"
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject(
        expect.objectContaining({
          data: {
            name: expect.any(String),
            email: expect.any(String),
            phone: expect.any(String),
            nationalId: expect.any(String),
            role: expect.any(String),
            permissions: expect.any(Array)
          },
          accessToken: expect.any(String)
        })
      );
    });
  });
});

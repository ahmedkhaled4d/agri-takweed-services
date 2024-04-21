import request from "supertest";
import AUTH_APP from "../../../auth/routes";
import ADMIN_APP from "../../routes";

describe("User Controller ", () => {
  let token: string;
  beforeAll(async () => {
    const res = await request(AUTH_APP)
      .post("/login/admin")
      .send({
        email: "admin@mail.com",
        password: "mahaseelAdmin"
      })
      .set("otptoken", process.env.OTP_TOKEN as string);
    token = res.body.accessToken;
  });

  it("Should get Engs with names", async () => {
    const res = await request(ADMIN_APP)
      .get("/user/engineers")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });

  describe("Engineer", () => {
    const phoneNum = `+20${Math.floor(Math.random() * 10)}`;
    const password = "123456";

    it("Should Register and not send OTP", async () => {
      const res = await request(ADMIN_APP)
        .post("/signup/engineer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "eng test test * 2",
          phone: phoneNum,
          password: password
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.phone).toBeDefined();
      expect(res.body.error).toBeUndefined();
    });

    it("Should fail to register without phone.", async () => {
      const res = await request(ADMIN_APP)
        .post("/signup/engineer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "eng test test * 2",
          password: password
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.phone).toBeUndefined();
      expect(res.body.error).toBeDefined();
    });
  });
});

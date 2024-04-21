import request from "supertest";
import AUTH_APP from "../../modules/auth/routes";

export const adminLogin = async () => {
  const res = await request(AUTH_APP)
    .post("/login/admin")
    .send({
      email: "admin@mail.com",
      password: "mahaseelAdmin"
    })
    .set("otptoken", process.env.OTP_TOKEN as string);
  return res.body.accessToken as string;
};

export const engLogin = async () => {
  const res = await request(AUTH_APP)
    .post("/login")
    .send({
      phone: "+20111111111",
      password: "123456"
    })
    .set("otptoken", process.env.OTP_TOKEN as string);
  expect(res.body.accessToken).toBeDefined();
  return res.body.accessToken as string;
};

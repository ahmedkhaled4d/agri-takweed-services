import request from "supertest";
import { Committee, CommitteeModel } from "../../../../models/takweed";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

describe("committee Admin Controller ", () => {
  let token: string;
  let committee: mongoose.Document<unknown, unknown, Committee> &
    Committee & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    token = await adminLogin();
    committee = new CommitteeModel({
      committeeDate: new Date(),
      mahaseelUser: new ObjectId("63a30ecfed981d4203ee03bf"),
      hagrUser: new ObjectId("639b2d9584165e16ed1ff101"),
      farms: [{ farmName: "test", url: "kaza.com", visit: false }]
    });
    await committee.save();
  });

  it("Should get committees", async () => {
    const res = await request(ADMIN_APP)
      .get("/committee")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });

  it("Should get one committee", async () => {
    const res = await request(ADMIN_APP)
      .get(`/committee/${committee._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });

  it("Should Create a committee", async () => {
    const res = await request(ADMIN_APP)
      .post(`/committee/`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        committeeDate: new Date(),
        mahaseelUser: "63a30ecfed981d4203ee03bf",
        hagrUser: "639b2d9584165e16ed1ff101",
        farms: [{ farmName: "test", url: "kaza.com", visit: false }]
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });

  it("Should get update committee", async () => {
    expect(committee.status).toBe("inprogress");
    const res = await request(ADMIN_APP)
      .put(`/committee/${committee._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accept" });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe("accept");
    expect(res.body.message).toBeUndefined();
  });

  it("Should delete one committee", async () => {
    const res = await request(ADMIN_APP)
      .delete(`/committee/${committee._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeUndefined();
    expect(res.body.message).toBeDefined();
  });

  it("Should Fail on creating a committee without user.", async () => {
    const res = await request(ADMIN_APP)
      .post(`/committee/`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        committeeDate: new Date(),
        hagrUser: "639b2d9584165e16ed1ff101",
        farms: [{ farmName: "test", url: "kaza.com", visit: false }]
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.data).toBeUndefined();
    expect(res.body.message).toBeDefined();
  });

  it("Should get committee users", async () => {
    const res = await request(ADMIN_APP)
      .get("/committee/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.farmCount).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });

  it("Should get committee users by Date", async () => {
    const res = await request(ADMIN_APP)
      .get(`/committee/users?date=${new Date().getDate() - 10}`)
      .set("Authorization", `Bearer ${token}`);
    console.log(res);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });
});

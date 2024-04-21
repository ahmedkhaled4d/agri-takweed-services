import mongoose from "mongoose";
import request from "supertest";
import CommitteeModel, {
  Committee
} from "../../../../models/takweed/committee.model";
import { engLogin } from "../../../../utils/__tests__";
import CLIENT_APP from "../../routes";
const ObjectId = mongoose.Types.ObjectId;

describe("Committee Client Controller", () => {
  let token: string;
  let committee: mongoose.Document<unknown, unknown, Committee> &
    Committee & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    token = await engLogin();
    committee = new CommitteeModel({
      committeeDate: new Date(),
      mahaseelUser: new ObjectId("63a30ecfed981d4203ee03bf"),
      hagrUser: new ObjectId("639b2d9584165e16ed1ff101"),
      farms: [{ farmName: "test", url: "kaza.com", visit: false }]
    });
    await committee.save();
  });

  it("Should get one's own committees", async () => {
    const res = await request(CLIENT_APP)
      .get("/committee")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
  });

  it("Should get one Committee", async () => {
    const res = await request(CLIENT_APP)
      .get(`/committee/${committee._id.toString()}`)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
  });

  it("Should update one Committee status", async () => {
    expect(committee.status).toBe("inprogress");
    const res = await request(CLIENT_APP)
      .put(`/committee/${committee._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({ status: "accept" });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toBe("accept");
    expect(res.body.data.farms[0].visit).toBe(false);
  });

  it("Should update one farm status", async () => {
    const farmId = committee.farms[0]._id as string;
    expect(farmId).toBeDefined();
    expect(committee.farms[0].visit).toBe(false);
    const res = await request(CLIENT_APP)
      .put(`/committee/${committee._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        farm: {
          _id: farmId,
          visit: true
        }
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.farms[0].visit).toBe(true);
  });

  describe("Committee Sort", () => {
    it("Should fail without query params", async () => {
      const res = await request(CLIENT_APP)
        .get(`/committee/${committee._id.toString()}/sort`)
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/json");
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
      expect(res.body.data).toBeUndefined();
    });

    it("Should work with query params", async () => {
      const res = await request(CLIENT_APP)
        .get("/committee/63ad70e4e16beb6999be4ad6/sort?lat=30&lng=30")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/json");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBeUndefined();
      expect(res.body.data).toBeDefined();
    });
  });
});

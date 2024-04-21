import request from "supertest";
import { CropModel, LocationModel } from "../../../../models";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";

describe("Reports Controller", () => {
  let token: string;
  let cropId: Array<string>;
  let governorates: Array<string>;
  beforeAll(async () => {
    token = await adminLogin();
    cropId = (await CropModel.find({}, "_id", { lean: true }).exec()).map(
      item => item._id.toString()
    );
    governorates = (
      await LocationModel.find({ type: "governorate" }, "_id", {
        lean: true
      }).exec()
    ).map(item => item._id.toString());
  });

  it("Should Get Reports", async () => {
    const res = await request(ADMIN_APP)
      .post("/report/excelInfo")
      .send({
        season: ["2023", "2022"],
        startDate: "2023-05-27",
        endDate: "2023-06-01",
        cropId,
        governorates
      })
      .set("Authorization", `Bearer ${token}`);

    if (res.body.message) console.log(res.body.message);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeDefined();
    expect(res.body.length).toBeGreaterThan(0);
    console.dir(res.body[0], { depth: null });
    expect(res.body.message).toBeUndefined();
  });
});

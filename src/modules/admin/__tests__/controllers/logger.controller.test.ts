import request from "supertest";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";
jest.mock("../../../../repositories/logger.repository.ts");

describe("Logger Controller", () => {
  let token: string;
  beforeAll(async () => {
    token = await adminLogin();
  });

  it("Should Get Logs", async () => {
    const res = await request(ADMIN_APP)
      .get("/logs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
  });

  it("Should Delete logs", async () => {
    const res = await request(ADMIN_APP)
      .delete("/logs?number=1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBeDefined();
  });
});

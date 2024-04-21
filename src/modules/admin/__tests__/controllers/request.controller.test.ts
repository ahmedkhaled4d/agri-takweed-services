import request from "supertest";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";
jest.mock("../../../../repositories/logger.repository.ts");

describe("Request Controller", () => {
  let token: string;
  beforeAll(async () => {
    token = await adminLogin();
  });

  it("Should Get Requests that have A+", async () => {
    // const reqToCreate = await generateFakeRequest();
    // // __AUTO_GENERATED_PRINT_VAR_START__
    // console.log("reqToCreate Created: %s", Boolean(reqToCreate)); // __AUTO_GENERATED_PRINT_VAR_END__
    // const newReq = await RequestModel.create(reqToCreate);

    const res = await request(ADMIN_APP)
      .get("/request?carbonFootprint=A+")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeDefined();
    // __AUTO_GENERATED_PRINT_VAR_START__
    console.log(
      "(anon)#(anon) data: %s",
      JSON.stringify(res.body.data, null, 2)
    ); // __AUTO_GENERATED_PRINT_VAR_END__
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(
      res.body.data.every(
        (req: Record<string, unknown>) => req.carbonFootprint === "A+"
      )
    );
    expect(res.body.message).toBeUndefined();
  });
});

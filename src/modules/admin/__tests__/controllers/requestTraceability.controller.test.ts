import request from "supertest";
import { HttpStatus } from "../../../../assets/httpCodes";
import { RequestTraceabilityModel } from "../../../../models";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";
jest.mock("../../../../repositories/logger.repository.ts");

describe("Request Traceability Controller", () => {
  let token: string;
  // TODO: Don't use hardcoded values
  const code = "4502000075";
  const variety = "برتقال بسره";
  const storeId = "63f723f1298484a3951353af";
  const distId = "63f727cf298484a3951354ba";
  const exportId = "643289ff3f021939391106b7";

  beforeAll(async () => {
    token = await adminLogin();
    await RequestTraceabilityModel.deleteMany({
      code: code
    });
  });

  it("Should Get charges", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/charge`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Request PostCharge", async () => {
    const res = await request(ADMIN_APP)
      .post(`/traceability/${code}/charge`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send(
        JSON.stringify([
          {
            variety,
            amountToAdd: 30
          }
        ])
      );
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.error).toBeUndefined();
  });

  it("Should send charge to store", async () => {
    const res = await request(ADMIN_APP)
      .post(`/traceability/${code}/store/${storeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send([
        {
          variety,
          amountToAdd: 10
        }
      ]);
    expect(res.statusCode).toEqual(HttpStatus.OK);
  });

  it("Should get store items", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/store/${storeId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Should send charge from store to dist", async () => {
    const res = await request(ADMIN_APP)
      .post(`/traceability/${code}/${storeId}/distribute/${distId}`)
      .set("Authorization", `Bearer ${token}`)
      .send([
        {
          variety,
          amountToAdd: 10
        }
      ]);
    expect(res.statusCode).toEqual(HttpStatus.OK);
  });

  it("Should send charge from dist to export", async () => {
    const res = await request(ADMIN_APP)
      .post(`/traceability/${code}/${distId}/send/${exportId}`)
      .set("Authorization", `Bearer ${token}`)
      .send([
        {
          variety,
          amountToAdd: 5
        }
      ]);
    expect(res.statusCode).toEqual(HttpStatus.OK);
  });

  it("Should get all store items", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/store`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Should get all dist items", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/dist`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Should get one", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Should get trace tree", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/tracetree`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Should get trace", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/trace`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("Should check export recieved charge", async () => {
    const res = await request(ADMIN_APP)
      .get(`/traceability/${code}/tracetree`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.filter(
        (item: Record<string, unknown>) => item.to === exportId
      ).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.filter(
        (item: Record<string, unknown>) => item.to === exportId
      )[0]
    ).toMatchObject({
      varieties: [
        {
          variety: expect.stringMatching(variety),
          amount: expect.any(Number),
          initialAmount: expect.any(Number),
          transactionDate: expect.any(String)
        }
      ],
      code: expect.stringMatching(code),
      to: expect.stringMatching(exportId),
      from: expect.stringMatching(distId)
    });
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });
});

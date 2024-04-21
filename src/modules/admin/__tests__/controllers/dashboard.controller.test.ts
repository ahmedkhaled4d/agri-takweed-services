import request from "supertest";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";

describe("Dashboard", () => {
  let token: string;

  describe("Counters", () => {
    const url = "/dashboard/counters";

    beforeAll(async () => {
      token = await adminLogin();
    });

    it("should return the correct response", async () => {
      const response = await request(ADMIN_APP)
        .get(url)
        .set("Authorization", `Bearer ${token}`)
        .query({ season: "2022" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        requestsToday: expect.any(Number),
        requests: expect.any(Number),
        farms: expect.any(Number),
        plotsTotalArea: expect.any(Number)
      });
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(ADMIN_APP)
        .get(url)
        .query({ season: "2022" });

      expect(response.status).toBe(401);
    });

    it("should default season if an invalid season is provided", async () => {
      const response = await request(ADMIN_APP)
        .get(url)
        .set("Authorization", `Bearer ${token}`)
        .query({ season: "invalid" });

      expect(response.status).toBe(200);
    });
  });
});

import * as path from "path";
import request from "supertest";
import { HttpStatus } from "../../../../assets/httpCodes";
import { Waypoint } from "../../../../types";
import { adminLogin } from "../../../../utils/__tests__";
import ADMIN_APP from "../../routes";

describe("Gpx View Controller", () => {
  let token: string;

  beforeAll(async () => {
    token = await adminLogin();
  });

  it("Should upload GPX and get its points", async () => {
    const res = await request(ADMIN_APP)
      .post(`/request/gpx/view`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", `${__dirname}/../fixtures/mostafa.gpx`);
    const body = res.body as {
      data: Array<Waypoint>;
    };

    console.log(body);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
    expect(body.data).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].lat).toBeDefined();
    expect(body.data[0].lon).toBeDefined();
  });

  it("Should upload GPX and send its points.", async () => {
    const resSetup = await request(ADMIN_APP)
      .post(`/request/gpx/view`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", path.join(__dirname, "../fixtures/OSAMA_18-DEC-22.gpx"));
    const bodySetup = resSetup.body as {
      data: Array<Waypoint>;
    };

    expect(resSetup.statusCode).toEqual(HttpStatus.OK);
    expect(resSetup.body.message).toBeUndefined();
    expect(resSetup.body.error).toBeUndefined();
    expect(bodySetup.data).toBeDefined();
    expect(bodySetup.data.length).toBeGreaterThan(0);
    expect(bodySetup.data[0].lat).toBeDefined();
    expect(bodySetup.data[0].lon).toBeDefined();

    console.log(bodySetup.data);
    const res = await request(ADMIN_APP)
      .post("/request/gpx/parse")
      .set("Authorization", `Bearer ${token}`)
      .send({ data: bodySetup.data });

    console.dir(res.body);
    expect(res.statusCode).toEqual(HttpStatus.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    // Check that data.code is not repeated.
    expect(res.body.data[0].code).toBeDefined();
    expect(res.body.data[0].flags).toBeDefined();
    expect(
      res.body.data.filter(
        (d: Record<string, string>) => d.code === res.body.data[0].code
      ).length
    ).toEqual(1);
    expect(res.body.data[0].gpx).toBeDefined();
    expect(res.body.data[0].gpx.length).toBeGreaterThan(0);
    expect(res.body.data[0].gpx[0].points.length).toBeGreaterThan(0);
    expect(res.body.message).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });
});

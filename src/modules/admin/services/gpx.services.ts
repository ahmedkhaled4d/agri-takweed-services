import { MongoClient } from "mongodb";
import { roundToTwo, convertToRadianFromDegree } from "../../../utils";

import * as turf from "@turf/turf";
import { GeometryModel } from "../../../models";
import { Point } from "../../../types";

export const calculatePolygonArea = (coordinates: Array<Point>) => {
  let p1;
  let p2;
  let area = 0;
  coordinates.push(coordinates[0]);
  if (coordinates.length > 2) {
    for (let i = 0; i < coordinates.length - 1; i++) {
      p1 = coordinates[i];
      p2 = coordinates[i + 1];
      area +=
        convertToRadianFromDegree(p2.lng - p1.lng) *
        (2 +
          Math.sin(convertToRadianFromDegree(p1.lat)) +
          Math.sin(convertToRadianFromDegree(p2.lat)));
    }

    area = (area * 6378137 * 6378137) / 2;
  }
  const areaFeddan = roundToTwo(Math.abs(area) * 0.00023809523809524);
  return areaFeddan;
};

function calculatePolygonArea2(coordinates: Array<Point>) {
  let p1;
  let p2;
  let area = 0;
  coordinates.push(coordinates[0]);
  if (coordinates.length > 2) {
    for (let i = 0; i < coordinates.length - 1; i++) {
      p1 = coordinates[i];
      p2 = coordinates[i + 1];
      area +=
        convertToRadianFromDegree(p2.lng - p1.lng) *
        (2 +
          Math.sin(convertToRadianFromDegree(p1.lat)) +
          Math.sin(convertToRadianFromDegree(p2.lat)));
    }
    area = (area * 6378137 * 6378137) / 2;
  }
  return roundToTwo(Math.abs(area) * 0.00023809523809524);
}

export const getIntersection = async (code: string) => {
  const inters: Array<unknown> = [];
  await GeometryModel.updateMany(
    {},
    { $pull: { "polygons.intersections": { landIntersectsWith: code } } }
  );
  await GeometryModel.updateMany(
    { "polygons.code": code },
    { $set: { "polygons.intersections": [] } }
  );
  const client = await MongoClient.connect(process.env.MONGO_DB ?? "");

  const db = client.db(process.env.DB_NAME ?? "test");
  try {
    // get all the pieces
    const res = await db
      .collection("geometries")
      .find({ "polygons.code": code })
      .toArray();
    const start = Date.now();
    for (let k = 0; k < res.length; k++) {
      // console.log(k)
      // res[k].polygons.coordinates
      const query = {
        polygons: {
          $geoIntersects: {
            $geometry: {
              type: "Polygon",
              coordinates: res[k].polygons.coordinates
            }
          }
        }
      };
      const result = await db.collection("geometries").find(query).toArray();
      for (let i = 0; i < result.length; i++) {
        // check that we found the same polygon.
        if (
          res[k].polygons.coordinates[0][0] ===
            res[k].polygons.coordinates[0][
              res[k].polygons.coordinates.length - 1
            ] &&
          result[i].polygons.coordinates[0][0] ===
            result[i].polygons.coordinates[0][
              result[i].polygons.coordinates.length - 1
            ]
        ) {
          // and check that we are not comparing the same polygon with itself.
          if (res[k].polygons.code === result[i].polygons.code) {
            continue;
          } else {
            const intersection = turf.intersect(
              turf.polygon(res[k].polygons.coordinates),
              turf.polygon(result[i].polygons.coordinates)
            );

            if (intersection) {
              const interPoly: Array<unknown> = [];
              let areaFeddan = 0;
              if (intersection.geometry.type === "MultiPolygon") {
                for (
                  let i = 0;
                  i < intersection.geometry.coordinates.length;
                  i++
                ) {
                  const interinterPoly = [];
                  for (
                    let j = 0;
                    j < intersection.geometry.coordinates[i][0].length;
                    j++
                  ) {
                    interinterPoly.push({
                      lat: intersection.geometry.coordinates[i][0][j][0],
                      lng: intersection.geometry.coordinates[i][0][j][1]
                    });
                  }
                  const areaPoly = calculatePolygonArea2([...interinterPoly]);
                  interPoly.push(interinterPoly);
                  areaFeddan += areaPoly;
                }
              } else {
                const interNoArrPoly = [];
                for (
                  let i = 0;
                  i < intersection.geometry.coordinates[0].length;
                  i++
                ) {
                  interNoArrPoly.push({
                    lat: intersection.geometry.coordinates[0][i][0],
                    lng: intersection.geometry.coordinates[0][i][1]
                  });
                }
                areaFeddan = calculatePolygonArea2([...interNoArrPoly]);
                interPoly.push(interNoArrPoly);
              }

              await GeometryModel.findOneAndUpdate(
                {
                  "polygons.code": code,
                  "polygons.point": res[k].polygons.point
                },
                {
                  $addToSet: {
                    "polygons.intersections": {
                      landIntersectsWith: result[i].polygons.code,
                      pieceIntersected: result[i].polygons.point,
                      areaOfIntersection: roundToTwo(areaFeddan),
                      intersectionCoords: interPoly
                    }
                  }
                },
                { new: true, lean: true }
              ).then(async data => {
                if (data === null) {
                  throw new Error("Request Not Found");
                }
                await GeometryModel.findOneAndUpdate(
                  {
                    "polygons.code": result[i].polygons.code,
                    "polygons.point": result[i].polygons.point
                  },
                  {
                    $addToSet: {
                      "polygons.intersections": {
                        landIntersectsWith: res[k].polygons.code,
                        pieceIntersected: res[k].polygons.point,
                        areaOfIntersection: areaFeddan,
                        intersectionCoords: interPoly
                      }
                    }
                  },
                  { new: true, lean: true }
                ).then(Data => {
                  if (Data === null) {
                    throw new Error("Request Not Found");
                  }
                });
              });
            }
          }
        }
      }
    }
    const duration = Date.now() - start;
    console.log(duration);
    return inters;
  } finally {
    client.close();
  }
};

import { Waypoint } from "../../../types";
import { isValidLat, isValidLng } from "../../../utils";
import { isValidDate } from "../../../utils/date.pipline";

// Validates GPX object and returns an array of errors if any.
export function validateGpxObject(
  gpxBody: Record<string, unknown> | Array<Record<string, unknown>>
):
  | {
      errors: Array<{
        message: string;
        error: string;
        fatal: boolean;
      }>;
    }
  | {
      errors?: Array<{
        message: string;
        error: string;
        fatal: boolean;
      }>;
      waypoints: Array<Waypoint>;
      toGeoJSON: () => {
        type: string;
        features: Array<{
          type: string;
          properties: {
            name: string;
            date: Date | undefined;
            ele: number;
          };
          geometry: {
            type: string;
            coordinates: [number, number, number];
          };
        }>;
      };
    } {
  if (!gpxBody) {
    return {
      errors: [
        {
          message: "No GPX object found.",
          error: "gpx.missing",
          fatal: true
        }
      ]
    };
  }

  if (!Array.isArray(gpxBody)) {
    gpxBody = [gpxBody];
  }

  if (gpxBody.length === 0) {
    return {
      errors: [
        {
          message: "No GPX object found.",
          error: "gpx.missing",
          fatal: true
        }
      ]
    };
  }

  const errors: Array<{
    message: string;
    error: string;
    fatal: boolean;
  }> = [];
  gpxBody.forEach((gpx, index) => {
    if (!gpx.lat || !isValidLat(gpx.lat as number)) {
      errors.push({
        message: `Invalid latitude at index ${index}. Required`,
        error: "gpx.invalid.lat",
        fatal: true
      });
    }

    if (!gpx.lon || !isValidLng(gpx.lon as number)) {
      errors.push({
        message: `Invalid longitude at index ${index}. Required`,
        error: "gpx.invalid.lng",
        fatal: true
      });
    }

    if (!gpx.ele) {
      errors.push({
        message: `Invalid elevation at index ${index}. Not Required.`,
        error: "gpx.invalid.ele",
        fatal: false
      });
    }

    if (!gpx.time || !isValidDate(gpx.time as string)) {
      errors.push({
        message: `Invalid time at index ${index}. Required`,
        error: "gpx.invalid.time",
        fatal: false
      });
    }

    if (!gpx.name) {
      errors.push({
        message: `Invalid name at index ${index}. Required`,
        error: "gpx.invalid.name",
        fatal: true
      });
    }
  });

  if (errors.length > 0 && errors.filter(e => e.fatal).length > 0) {
    return {
      errors
    };
  }

  const waypoints = gpxBody.map(gpx => ({
    lat: gpx.lat as number,
    lon: gpx.lon as number,
    ele: gpx.ele as number,
    time: isValidDate(gpx.time) ? (new Date(gpx.time) as Date) : undefined,
    name: gpx.name as string
  }));

  return {
    errors,
    waypoints: waypoints.sort((a, b) => a.name?.localeCompare(b.name)),
    toGeoJSON: () => {
      return {
        type: "FeatureCollection",
        features: waypoints
          .sort((a, b) => a.name?.localeCompare(b.name))
          .map(gpx => {
            return {
              type: "Feature",
              properties: {
                name: gpx.name,
                date: gpx.time,
                ele: gpx.ele
              },
              geometry: {
                type: "Point",
                coordinates: [gpx.lon, gpx.lat, gpx.ele]
              }
            };
          })
      };
    }
  };
}

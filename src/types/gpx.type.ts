export interface Point {
  lat: number;
  lng: number;
  ele?: number;
  time?: Date;
}
export interface Gpx {
  name_ar: string;
  variety: string | null;
  points: Array<Point>;
  area: number;
}

export interface Waypoint {
  name: string;
  lat: number;
  lon: number;
  ele: number;
  time?: Date;
}

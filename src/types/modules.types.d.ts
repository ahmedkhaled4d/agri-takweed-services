/* eslint-disable require-jsdoc */

/* eslint-disable no-unused-vars */
declare module "twitter_cldr" {
  export function load(langauge: "ar" | "en"): any;
}

declare module "mahaseel-gpxparser" {
  type Waypoints = Array<Waypoint>;
  interface Waypoint {
    name: string;
    sym: string;
    lat: number;
    lon: number;
    ele: number;

    cmt: string;
    desc: string;
    time: Date | string | number;
  }

  type Coordinate = Array<number>;
  interface Feature {
    geometry: {
      type: "LineString";
      coordinates: Coordinate;
    };
    properties: {
      name: string;
      cmt: string;
      desc: string;
      src: string;
      number: number;
      link: string;
      type: string;
    };
  }
  export default class gpxParser {
    // eslint-disable-next-line no-unused-labels
    waypoints: Waypoints;

    parse: (gpxstring: string | Buffer) => void;

    toGeoJSON(): {
      type: "FeatureCollection";
      features: Array<Feature>;
      properties: {
        name: string;
        desc: string;
        time: string;
        author: string;
        link: string;
      };
    };
  }
}

declare module "fcm-node" {
  export type callback = (err: Error, res: unknown) => void;

  interface googleCreds {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
  }

  interface message {
    to: string;
    notification: {
      title: string;
      body: unknown;
    };
    data: unknown;
  }

  export default class FCM {
    constructor(accountKey: googleCreds);

    send(message: message, cb: callback);

    unsubscribeToTopic(
      deviceTokens: Array<string> | string,
      topicName: string,
      callback: callback
    );
    subscribeToTopic(
      deviceTokens: Array<string> | string,
      topicName: string,
      callback: callback
    );
  }
}

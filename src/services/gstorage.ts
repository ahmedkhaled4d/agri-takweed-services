import { SaveOptions, Storage } from "@google-cloud/storage";
import fs from "fs";
import { Readable } from "stream";
import { APP_ENV, FB_APP_SERVICE_ACCOUNT } from "../config";

type BucketName =
  | "gs://takweed-certificates"
  | "gs://takweed-docs"
  | "gs://takweed-gpx-archive";

const storage = new Storage({
  credentials: FB_APP_SERVICE_ACCOUNT,
  projectId: "takweed-eg"
});

const options: SaveOptions = {
  gzip: true,
  metadata: {
    // (If the contents will change, use cacheControl: 'no-cache')
    cacheControl: "public, max-age=31536000"
  }
};

export function getBucket(bucketName: BucketName) {
  return storage.bucket(bucketName);
}

export const uploadToGCP =
  APP_ENV === "DEV"
    ? // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      async (_fileName: string, _storageName: BucketName) =>
        new Promise<void>(resolve => {
          setTimeout(() => {
            console.log(`uploadToGCP - ${_fileName} - File upload successful`);
            resolve();
          }, 1000);
        })
    : async (fileName: string, storageName: BucketName) => {
        // storage file
        storage
          .bucket(storageName)
          .upload(fileName, options)
          .then(() => console.log(`${fileName} - File upload successful`))
          .catch(e => console.error(e))
          .finally(() => {
            fs.unlinkSync(fileName);
          });
      };

export const uploadToGCPBuffer =
  APP_ENV === "DEV"
    ? // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      (_fileName: string, _file: Buffer, _storageName: BucketName) =>
        new Promise<{ result: unknown; err: null }>(resolve =>
          setTimeout(() => {
            console.log(
              `uploadToGCPBuffer - ${_fileName} - File upload successful`
            );
            resolve({
              result: Buffer.from("Something"),
              err: null
            });
          }, 100)
        )
    : async (fileName: string, file: Buffer, storageName: BucketName) => {
        try {
          // storage file
          const result = await storage
            .bucket(storageName)
            .file(fileName)
            .save(file, options);
          return {
            result,
            err: null
          };
        } catch (err) {
          return {
            result: null,
            err: err
          };
        }
      };

export const uploadToGCPStream =
  APP_ENV === "DEV"
    ? (
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        _fileName: string,
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        _stream: Readable,
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        _contentType: string,
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        _storageName: BucketName
      ) =>
        new Promise<void>(resolve =>
          setTimeout(() => {
            console.log(
              `uploadToGCPStream - ${_fileName} - File upload successful`
            );
            resolve();
          }, 100)
        )
    : (
        fileName: string,
        stream: Readable,
        contentType: string,
        storageName: BucketName
      ) => {
        return new Promise<void>((resolve, reject) => {
          const file = storage.bucket(storageName).file(fileName);

          const writeStream = file.createWriteStream({
            metadata: {
              contentType: contentType
            }
          });
          writeStream.on("error", err => {
            return reject(err);
          });

          writeStream.on("finish", () => {
            resolve();
          });
          stream.pipe(writeStream);
        });
      };

export const getFilesSignedUrl = async (
  filePath: string,
  storageName: BucketName
) => {
  return new Promise<Array<string>>((resolve, reject) => {
    storage
      .bucket(storageName)
      .getFiles({
        prefix: filePath
      })
      .then(async ([files]) => {
        const arr: string[] = [];
        for (const file of files) {
          const signedUrl = await file.getSignedUrl({
            action: "read",
            expires: new Date(Date.now() + 20 * 60000)
          });
          arr.push(signedUrl.toString());
        }
        resolve(arr);
      })
      .catch(err => reject(err));
  });
};

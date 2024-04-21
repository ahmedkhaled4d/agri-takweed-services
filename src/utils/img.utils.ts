export function getFileMimeTypeRegex(): {
  // eslint-disable-next-line no-unused-vars
  [Symbol.match](string: string): RegExpMatchArray | null;
} {
  return /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/;
}

export function getMimeType(base64file: string) {
  return base64file.split(";")[0].split(":")[1];
}

export function getExtension(mimetype: string) {
  const format = mimetype.split("/")[1];
  return `.${format}`;
}

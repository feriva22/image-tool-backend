require("dotenv").config();
import Jimp from "jimp";

export class GenericError extends Error {
  public httpCode: number = 500;
  public message: string = "Internal Server Error";

  constructor(httpCode: number, message?: string) {
    super();
    Object.setPrototypeOf(this, GenericError.prototype);
    if (httpCode) this.httpCode = httpCode;
    if (message) this.message = message;
    this.stack = null;
  }

  toJSON() {
    return {
      message: this.message,
      environtment: process.env.NODE_ENV,
      app_version: process.env.APP_VERSION || "none",
    };
  }
}

export function decodeBase64Image(dataString) {
  return Buffer.from(dataString, "base64");
}

export function generateNameImage(savePath, type) {
  var crypto = require("crypto");
  var seed = crypto.randomBytes(20);
  var sha1Gen = crypto
    .createHash("sha1")
    .update(seed)
    .digest("hex");
  const imgName = "img-" + sha1Gen;
  const imgType = type;
  const uploadedPath = savePath + imgName + "." + imgType;
  return uploadedPath;
}

export async function generateWatermarkImage(imgPath: string, waterMarkText: string): Promise<Jimp> {
  const WATERMARK_MARGIN_PERCENTAGE = 5;
  const [image] = await Promise.all([Jimp.read(imgPath)]);
  const fontWatermark = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const loc_x = image.bitmap.width - image.bitmap.width * 0.4;
  const loc_y = image.bitmap.height - image.bitmap.height * 0.1;
  return image.print(fontWatermark, loc_x, loc_y, waterMarkText);
}

export async function generateImageNewType(imgPath: string, targetSave: string, targetType: string): Promise<Jimp> {
  const [image] = await Promise.all([Jimp.read(imgPath)]);
  return await image.quality(60).writeAsync(targetSave);
}

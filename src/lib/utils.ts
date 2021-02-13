require("dotenv").config();
import Jimp from "jimp";
import { unitOfTime } from "moment";
import moment from "moment";

import { ImageHost } from "../database/entity/ImageHost";
import { getMongoRepository, ObjectID } from "typeorm";
const { BlobServiceClient } = require("@azure/storage-blob");

export enum UploadExpiration {
  P0M = "P0M",
  P5M = "P5M",
  P15M = "P15M",
  P30M = "P30M",
  P1H = "P1H",
  P2H = "P2H",
  P6H = "P6H",
  P1D = "P1D",
  P2D = "P2D",
  P3D = "P3D",
  P1W = "P1W",
  P2W = "P2W",
}
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

export function getExpireFromDate(fromDate: Date, expiry_type: UploadExpiration): Date {
  const time = parseInt(expiry_type.match(/\d+/)[0]);
  const time_unit = expiry_type.substring(expiry_type.length - 1).toLowerCase();
  return moment(fromDate)
    .add(<unitOfTime.DurationConstructor>time_unit, time)
    .toDate();
}

export function decodeBase64Image(dataString) {
  return Buffer.from(dataString, "base64");
}

export function generateNameImage(savePath, type) {
  var crypto = require("crypto");
  var seed = crypto.randomBytes(20);
  var sha1Gen = crypto.createHash("sha1").update(seed).digest("hex");
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

export async function deleteExpiredImage() {
  const imageHostRepo = getMongoRepository(ImageHost);
  const allExpireImage = await imageHostRepo.find({
    where: {
      expirate: {
        $lt: new Date(),
      },
    },
  });

  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONSTRING);
  const containerName = process.env.AZURE_BLOB_CONTAINER_IMG;
  const containerClient = blobServiceClient.getContainerClient(containerName);

  allExpireImage.forEach(async img => {
    const expireBlob = containerClient.getBlockBlobClient(img.blob_name);
    const response = await expireBlob.delete();
    await imageHostRepo.delete(img.id);
  });
}

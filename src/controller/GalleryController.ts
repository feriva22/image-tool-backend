import {
  JsonController,
  Param,
  BodyParam,
  Get,
  Post,
  Put,
  Delete,
  QueryParams,
  Authorized,
  CurrentUser,
} from "routing-controllers";
import { getMongoRepository } from "typeorm";
import { ImageHost } from "../database/entity/ImageHost";
export enum Permission {
  Public = "PUBLIC",
  Private = "PRIVATE",
  Secure = "SECURE",
}
import moment from "moment";
const { BlobServiceClient, BlobSASPermissions } = require("@azure/storage-blob");

@JsonController("/gallery")
export class GalleryController {
  @Get("/")
  async getAllImage() {
    const imageHostRepo = getMongoRepository(ImageHost);
    const allPublicImg = await imageHostRepo.find({
      where: { permission: Permission.Public },
      order: { created_date: "DESC" },
    });

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONSTRING);
    const containerName = process.env.AZURE_BLOB_CONTAINER_IMG;
    const containerClient = blobServiceClient.getContainerClient(containerName);

    allPublicImg.forEach(async img => {
      const pubImage = containerClient.getBlockBlobClient(img.blob_name);
      const url = await pubImage.generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: moment().add(5, "m").toDate(),
      });
      img.url = url;
    });
    return allPublicImg;
  }
}

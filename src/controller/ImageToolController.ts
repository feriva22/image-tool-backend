import {
  JsonController,
  Param,
  BodyParam,
  Get,
  Post,
  Put,
  Delete,
  QueryParams,
  Res,
  Body,
  HeaderParam,
  Params,
} from "routing-controllers";
import { getMongoRepository } from "typeorm";
import { IsNotEmpty, IsOptional, IsEnum, IsBase64, IsString } from "class-validator";
import {
  GenericError,
  decodeBase64Image,
  generateNameImage,
  generateImageNewType,
  getExpireFromDate,
  UploadExpiration,
} from "../lib/utils";
import { ImageHost } from "../database/entity/ImageHost";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
import fs from "fs";
import moment from "moment";
const { BlobServiceClient, BlobSASPermissions } = require("@azure/storage-blob");
var url = require("url");
class imgRestorationData {
  @IsBase64()
  img: string;

  @IsString()
  type: string;

  @IsString()
  targetType: string;
}

export enum Permission {
  Public = "PUBLIC",
  Private = "PRIVATE",
  Secure = "SECURE",
}

class imgHostingRequest {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsBase64()
  img: string;

  @IsEnum(Permission)
  permission: Permission;

  @IsString()
  @IsOptional()
  pass_secure: string | null;

  @IsEnum(UploadExpiration)
  upload_expiration: UploadExpiration;
}

let save_filepath = "public/upload/";

@JsonController("/image-tool")
export class ImageToolController {
  @Post("/convert")
  async convertTypeImg(@Body({ required: true }) data: imgRestorationData, @HeaderParam("Host") host: string) {
    const fsPromises = fs.promises;
    const base64Img = data.img;
    const decodedImg = decodeBase64Image(base64Img);
    const uploadedPath = generateNameImage(save_filepath, data.type);
    try {
      //save first source img
      await fsPromises.writeFile(__dirname + "/../" + uploadedPath, decodedImg);
      //convert to selected target type
      const newImgPath = generateNameImage(save_filepath, data.targetType);
      await generateImageNewType(__dirname + "/../" + uploadedPath, __dirname + "/../" + newImgPath, data.targetType);
      return {
        status: "OK",
        preImg: "http://" + host + "/" + uploadedPath,
        postImg: "http://" + host + "/download?path=" + newImgPath,
      };
    } catch (err) {
      console.log(err);
      throw new GenericError(400, "Failed to process request");
    }
  }

  @Post("/hosting/validate/:id")
  async validateURL(@Param("id") id: string) {
    const imageHostRepo = getMongoRepository(ImageHost);
    const imageData = await imageHostRepo.findOne({
      where: { gen_id: id },
    });
    if (imageData) {
      if (imageData.permission !== Permission.Secure) {
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONSTRING);
        const containerName = process.env.AZURE_BLOB_CONTAINER_IMG;
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(imageData.blob_name);
        const url = await blockBlobClient.generateSasUrl({
          permissions: BlobSASPermissions.parse("r"),
          expiresOn: moment().add(5, "m").toDate(),
        });
        return { ...imageData, url: url };
      } else {
        return { permission: imageData.permission };
      }
    } else {
      throw new GenericError(404, "Invalid ID");
    }
  }
  //TODO need update when object id is string
  @Post("/hosting/get_info_secure/:id")
  async getInfo(@Param("id") id: string, @BodyParam("secret", { required: true }) secret: string) {
    const imageHostRepo = getMongoRepository(ImageHost);
    const imageData = await imageHostRepo.findOne({
      where: { gen_id: id, secret_access: secret },
    });
    if (imageData) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONSTRING);
      const containerName = process.env.AZURE_BLOB_CONTAINER_IMG;
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(imageData.blob_name);
      const url = await blockBlobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: moment().add(5, "m").toDate(),
      });
      return { ...imageData, url: url };
    } else {
      throw new GenericError(404, "Invalid ID");
    }
  }

  @Post("/hosting/gen_url")
  async gen_shareUrlImg(
    @Body({ required: true }) data: imgHostingRequest,
    @HeaderParam("Host") host: string,
    @HeaderParam("Referer") referer: string
  ) {
    const parserUrl = url.parse(referer);
    const baseUrl = parserUrl.protocol + "//" + parserUrl.host;
    try {
      //check permission first
      if (data.permission == Permission.Secure && data.pass_secure == "") {
        throw new GenericError(400, "Provide secure password");
      }

      let newImgHost = new ImageHost();
      newImgHost.title = data.title;
      newImgHost.description = data.title;
      newImgHost.blob_name = uuidv4() + ".png";
      newImgHost.gen_id = nanoid(5);
      newImgHost.gen_url = baseUrl + "/gen_url/" + newImgHost.gen_id;
      newImgHost.permission = data.permission;
      newImgHost.secret_access = data.pass_secure;
      newImgHost.expirate_type = data.upload_expiration;
      newImgHost.expirate =
        data.upload_expiration == UploadExpiration.P0M ? null : getExpireFromDate(new Date(), data.upload_expiration);

      const base64Img = data.img;
      const decodedImg = decodeBase64Image(base64Img);

      //save to blob storage
      const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONSTRING);
      const containerName = process.env.AZURE_BLOB_CONTAINER_IMG;
      const containerClient = blobServiceClient.getContainerClient(containerName);

      const blockBlobClient = containerClient.getBlockBlobClient(newImgHost.blob_name);
      const uploadBlobResponse = await blockBlobClient.upload(decodedImg, decodedImg.length);
      if (uploadBlobResponse != null) {
        const imageHostRepo = getMongoRepository(ImageHost);

        return await imageHostRepo.save(newImgHost);
      } else {
        throw new GenericError(500, "Failed to upload file");
      }
    } catch (e) {
      throw new GenericError(500, e);
    }
  }
}

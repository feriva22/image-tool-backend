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
} from "routing-controllers";
import { getMongoRepository } from "typeorm";
import { IsOptional, IsBase64, IsString } from "class-validator";
import { GenericError, decodeBase64Image, generateNameImage, generateImageNewType } from "../lib/utils";
import fs from "fs";

class imgRestorationData {
  @IsBase64()
  img: string;

  @IsString()
  type: string;

  @IsString()
  targetType: string;
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
}

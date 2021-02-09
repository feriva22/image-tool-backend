import { JsonController, Param, BodyParam, Get, Post, Put, Delete, HeaderParam, Body } from "routing-controllers";
import { GenericError, decodeBase64Image, generateNameImage, generateWatermarkImage } from "../lib/utils";
import { IsOptional, IsBase64, IsString } from "class-validator";
import { getMongoManager } from "typeorm";
import { ImageRestoration } from "../database/entity";
import fs from "fs";

class imgRestorationData {
  @IsBase64()
  img: string;

  @IsString()
  type: string;
}
let save_filepath = "public/upload/";

@JsonController("/restoration")
export class RestorationController {
  @Post("/convert")
  async convertImage(@Body({ required: true }) data: imgRestorationData, @HeaderParam("Host") host: string) {
    const fsPromises = fs.promises;
    const base64Img = data.img;
    const decodedImg = decodeBase64Image(base64Img);
    const uploadedPath = generateNameImage(save_filepath, data.type);
    try {
      //save first source img
      await fsPromises.writeFile(__dirname + "/../" + uploadedPath, decodedImg);

      //generate new watermark image
      const newImg = await generateWatermarkImage(__dirname + "/../" + uploadedPath, "Created with DeepRest Image");
      const newImgPath = generateNameImage(save_filepath, newImg._originalMime.split("/")[1]);
      await newImg.writeAsync(__dirname + "/../" + newImgPath);

      //save to db
      const newImgObj = new ImageRestoration();
      newImgObj.preimg_url = uploadedPath;
      newImgObj.postimg_url = newImgPath;
      const manager = getMongoManager();
      await manager.save(newImgObj);

      return {
        status: "OK",
        preImg: "http://" + host + "/" + uploadedPath,
        postImg: "http://" + host + "/" + newImgPath,
      };
    } catch (err) {
      console.log(err);
      throw new GenericError(400, "Failed to process request");
    }
  }
}

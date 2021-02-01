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
import { ImageRestoration } from "../database/entity";

@JsonController("/gallery")
export class GalleryController {
  @Get("/")
  async getAllImage() {
    const imgRestorationRepos = getMongoRepository(ImageRestoration);
    const allImg = imgRestorationRepos.find({ order: { created_date: "DESC" } });
    return allImg;
  }
}

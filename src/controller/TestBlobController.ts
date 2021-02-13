import { JsonController, Param, BodyParam, Get, Post, Put, Delete, HeaderParam, Body } from "routing-controllers";
import { GenericError } from "../lib/utils";

const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuid } = require("uuid");

@JsonController("/testblob")
export class TestBlobController {
  @Get("/")
  async showContainerDetail() {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONSTRING);
      const containerName = process.env.AZURE_BLOB_CONTAINER_IMG;
      const containerClient = blobServiceClient.getContainerClient(containerName);

      const fileNametoUpload = "fileku.txt";
      const blockBlobClient = containerClient.getBlockBlobClient(fileNametoUpload);
      console.log("\nUploading to Azure storage as blob:\n\t", fileNametoUpload);
      const data = "Hello, World!";
      const uploadBlobResponse = await blockBlobClient.upload(data, data.length);

      return uploadBlobResponse;
    } catch (e) {
      throw new GenericError(400, e);
    }
  }
}

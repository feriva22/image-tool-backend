import "reflect-metadata";
import database from "./database";

export default async () => {
  const connection = await database();
  console.log("DB loaded and connected 🔥");
};

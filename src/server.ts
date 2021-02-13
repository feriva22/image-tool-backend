require("dotenv").config();

import "reflect-metadata"; // this shim is required
import { useExpressServer } from "routing-controllers";
import loaders from "./loaders";
import { deleteExpiredImage } from "./lib/utils";

async function main() {
  console.log(`Running on Environtment ${process.env.NODE_ENV} 🔥`);
  console.log(`Version App : ${process.env.APP_VERSION || "none"}`);

  const cron = require("node-cron");
  let express = require("express");
  let cors = require("cors");
  let app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  //app.use(express.urlencoded({ limit: "50mb" }));

  // creates express app, registers all controller routes and returns you express app instance
  useExpressServer(app, {
    routePrefix: "/api",
    controllers: [__dirname + "/controller/*.js"], // we specify controllers we want to use
  });

  app.use("/public", express.static(__dirname + "/public"));
  app.get("/download", function (req, res) {
    let url_path = req.query.path;
    res.download(__dirname + "/" + url_path);
  });

  if (process.env.USE_DB == "true") {
    try {
      await loaders(); //load all loaders
    } catch (err) {
      console.log("Failed to connect Database 🙈");
      console.error(err);
    }
  }

  //Running cronjob to delete all image expiry every 2 minute
  cron.schedule("*/2 * * * *", function () {
    deleteExpiredImage();
  });

  const PORT = process.env.PORT || 4000;
  // run express application
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[LISTEN] 🚀🚀🚀 Server running on port ${PORT}`);
  });
}
main();

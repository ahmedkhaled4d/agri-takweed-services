/**
 * loading files and modules
 */
import "dotenv/config";
import express from "express";
import { connectToDatabase } from "./utils/db";
import { checkConfig } from "./config";
/**
 * import Routes
 */
import AUTH_APP from "./modules/auth/routes";
import ADMIN_APP from "./modules/admin/routes";
import CLIENT_APP from "./modules/client/routes";
import SWAGGER_APP from "./modules/swagger";

checkConfig();
connectToDatabase();
const port = process.env.PORT ?? 5000;

process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
process.env.APP_ENV = process.env.APP_ENV ?? "DEV";

/**
 * run services
 */
const app = express();
app.use("/takweed-eg/us-central1/client", CLIENT_APP);
app.use("/takweed-eg/us-central1/admin", ADMIN_APP);
app.use("/takweed-eg/us-central1/auth", AUTH_APP);
app.use("/takweed-eg/us-central1/docs", SWAGGER_APP);

process.on("unhandledRejection", (reason, promise) => {
  console.error("unhandledRejection:", reason);
  console.error("unhandledRejection:", promise);
});

// error handler for uncaught exceptions
process.on("uncaughtException", error => {
  console.error("uncaughtException:", error);
});

app.listen(port, () =>
  console.log(`Server Started on Port ${port} and docs on /docs`)
);

/**
 * loading files and modules
 */
import "dotenv/config";
import * as fireFunction from "firebase-functions/v1";
import { connectToDatabase } from "./utils/db";
import { checkConfig } from "./config";
/**
 * import Routes
 */
import AUTH_APP from "./modules/auth/routes";
import ADMIN_APP from "./modules/admin/routes";
import CLIENT_APP from "./modules/client/routes";
// import SWAGGER_APP from "./modules/swagger";

checkConfig();
connectToDatabase();

process.on("unhandledRejection", (reason, promise) => {
  console.error("unhandledRejection:", reason);
  console.error("unhandledRejection:", promise);
});

// error handler for uncaught exceptions
process.on("uncaughtException", error => {
  console.error("uncaughtException:", error);
});

/**
 * run services
 */
export const auth = fireFunction.https.onRequest(AUTH_APP);
export const admin = fireFunction
  .runWith({
    memory: "512MB",
    timeoutSeconds: 7 * 60 // 7 minutes
  })
  .https.onRequest(ADMIN_APP);
export const client = fireFunction.https.onRequest(CLIENT_APP);

// export const docs = https.onRequest(SWAGGER_APP);

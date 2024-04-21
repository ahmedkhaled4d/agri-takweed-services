import "dotenv/config"; // For .env file
import mongoose from "mongoose"; // Db
import { connectToDatabase } from "../utils/db";

beforeAll(async () => {
  console.log("\nStarting db\n");
  await connectToDatabase();
  // await connectToDatabase("mongodb://localhost:27017/takweed");
  console.log("\nConnected, Starting tests...\n");
});

afterAll(async () => {
  try {
    console.log("\nDisconnecting from DB...\n");
    await mongoose.connection.close();
    console.log("\nDisconnected\n");
  } catch (err) {
    console.log(err);
  }
});

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("onlineevent");
    console.log("Connected to MongoDB successfully");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return db;
}

export { connectDB, getDB };

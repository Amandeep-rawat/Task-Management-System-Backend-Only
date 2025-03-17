



import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config(); // .env variables को लोड करना

// Create Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL, // Redis Cloud URL from .env
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
    process.exit(1); // Exit process on failure
  }
})();

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

// Cache connection across hot reloads in dev
let cached = global._mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
      })
      .then((mongooseInstance) => mongooseInstance)
      .catch((err) => {
        cached.promise = null; // retry next time
        console.error("MongoDB connection failed:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  if (process.env.NODE_ENV !== "production") {
    global._mongoose = cached;
  }
  return cached.conn;
}

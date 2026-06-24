import dns from "node:dns";
import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };

const cached: MongooseCache = globalCache.mongooseCache ?? { conn: null, promise: null };
globalCache.mongooseCache = cached;

/** Windows home routers often refuse Node SRV lookups — set fallbacks at import time. */
function bootstrapMongoDns(): void {
  const uri = getConnectionUri();
  if (!uri.startsWith("mongodb+srv://")) return;
  dns.setServers([...new Set([...dns.getServers(), "8.8.8.8", "1.1.1.1", "1.0.0.1"])]);
}

function getConnectionUri(): string {
  const direct = process.env.MONGODB_URI_DIRECT?.trim();
  if (direct) return direct;
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required");
  return uri;
}

bootstrapMongoDns();

export async function connectDb(): Promise<typeof mongoose> {
  const uri = getConnectionUri();
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || "metavision",
        serverSelectionTimeoutMS: 15_000,
        family: 4,
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/** Returns null when MongoDB is unreachable (build / offline). */
export async function tryConnectDb(): Promise<typeof mongoose | null> {
  try {
    return await connectDb();
  } catch {
    return null;
  }
}

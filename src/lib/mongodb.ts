import dns from "node:dns";
import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };

const cached: MongooseCache = globalCache.mongooseCache ?? { conn: null, promise: null };
globalCache.mongooseCache = cached;

function resolveConnectionUri(): string | null {
  const direct = process.env.MONGODB_URI_DIRECT?.trim();
  if (direct) return direct;
  const uri = process.env.MONGODB_URI?.trim();
  return uri || null;
}

/** Windows home routers often refuse Node SRV lookups — set fallbacks when using Atlas SRV. */
function bootstrapMongoDns(uri: string): void {
  if (!uri.startsWith("mongodb+srv://")) return;
  dns.setServers([...new Set([...dns.getServers(), "8.8.8.8", "1.1.1.1", "1.0.0.1"])]);
}

/**
 * Lazy MongoDB connection. Returns null when MONGODB_URI is unset (build / Vercel static phase).
 */
export async function connectDb(): Promise<typeof mongoose | null> {
  const uri = resolveConnectionUri();

  if (!uri) {
    console.warn("⚠️ MONGODB_URI not set — skipping MongoDB connection");
    return null;
  }

  bootstrapMongoDns(uri);

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || "metavision",
        bufferCommands: false,
        serverSelectionTimeoutMS: 15_000,
        family: 4,
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

/** Alias for connectDb */
export const connectMongo = connectDb;

/** Returns null when MongoDB is unreachable or not configured. */
export async function tryConnectDb(): Promise<typeof mongoose | null> {
  try {
    return await connectDb();
  } catch {
    return null;
  }
}

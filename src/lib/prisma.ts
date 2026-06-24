/**
 * MongoDB is the primary database.
 * Optional Prisma/Supabase PostgreSQL when DATABASE_URL or Supabase DB credentials are set.
 */
export { connectDb } from "./mongodb";
export { getPrisma, syncUserToPrisma } from "./prisma-client";

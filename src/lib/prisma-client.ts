import type { PrismaClient } from "@prisma/client";
import { buildSupabaseDatabaseUrls, getSupabaseConfig } from "@/lib/supabase-config";

let client: PrismaClient | null = null;
let connectAttempted = false;

function resolveDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const cfg = getSupabaseConfig();
  if (!cfg.configured) return null;
  return buildSupabaseDatabaseUrls(cfg.projectRef, cfg.dbPassword).pooled;
}

/** Optional Prisma client — connects when DATABASE_URL or Supabase DB password is configured. */
export async function getPrisma(): Promise<PrismaClient | null> {
  const url = resolveDatabaseUrl();
  if (!url) return null;

  if (!client && !connectAttempted) {
    connectAttempted = true;
    try {
      const { PrismaClient } = await import("@prisma/client");
      client = new PrismaClient({
        datasources: { db: { url } },
      });
      await client.$connect();
    } catch (err) {
      console.warn("Prisma optional connect failed:", err);
      client = null;
    }
  }
  return client;
}

export async function syncUserToPrisma(input: {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  password?: string | null;
  role?: string;
}) {
  const prisma = await getPrisma();
  if (!prisma) return null;

  try {
    return await prisma.user.upsert({
      where: { phone: input.phone },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? undefined,
        role: input.role ?? "USER",
      },
      create: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email ?? undefined,
        password: input.password ?? undefined,
        role: input.role ?? "USER",
      },
    });
  } catch (err) {
    console.warn("Prisma user sync failed:", err);
    return null;
  }
}

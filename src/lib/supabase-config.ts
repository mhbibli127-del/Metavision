/**
 * Supabase PostgreSQL connection builder.
 * Dashboard: Settings → Database → Connection string (URI)
 */
export function buildSupabaseDatabaseUrls(projectRef: string, password: string) {
  const enc = encodeURIComponent(password);
  const ref = projectRef.trim().toLowerCase();

  return {
    /** Prisma migrate / db push (direct) */
    direct: `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
    /** App runtime (pooler, recommended) */
    pooled: `postgresql://postgres.${ref}:${enc}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`,
    /** Alternate pooler port */
    pooledSession: `postgresql://postgres.${ref}:${enc}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  };
}

export function parseSupabaseProjectRef(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    parseSupabaseProjectRef(url) ||
    "";

  return {
    url: url || (projectRef ? `https://${projectRef}.supabase.co` : ""),
    projectRef,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
    secretKey:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      "",
    dbPassword: process.env.SUPABASE_DB_PASSWORD ?? "",
    configured: Boolean(projectRef && process.env.SUPABASE_DB_PASSWORD),
  };
}

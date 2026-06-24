import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase-config";

let adminClient: SupabaseClient | null = null;

/** Server-side Supabase (secret key — bypasses RLS) */
export function getSupabaseAdmin(): SupabaseClient | null {
  const { url, secretKey } = getSupabaseConfig();
  if (!url || !secretKey) return null;
  if (!adminClient) {
    adminClient = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/** Browser-safe client factory */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseConfig();
  if (!url || !publishableKey) return null;
  return createClient(url, publishableKey);
}

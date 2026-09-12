import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Modo demonstração (build com --mode demo): dados só no navegador, para ver as telas sem servidor.
export const isDemo = import.meta.env.VITE_DEMO === "1";

export const isSupabaseConfigured = isDemo || Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  !isDemo && url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

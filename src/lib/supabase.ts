import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/**
 * `null` quando as variáveis não estão definidas — assim o build não rebenta em
 * ambientes sem `.env`, e quem chama decide o que fazer (ver `requireSupabase`).
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

/**
 * Falha alto em vez de devolver dados vazios em silêncio: numa app de
 * facturação, "sem facturas" e "não consegui ler as facturas" não podem
 * parecer a mesma coisa.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Copie .env.example para .env e preencha " +
        "VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return supabase;
}

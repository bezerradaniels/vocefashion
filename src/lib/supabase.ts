import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase. Sem as variáveis abaixo, o site segue no modo demonstração
 * (localStorage, ver src/lib/db.ts).
 *
 * VITE_SUPABASE_URL              https://<ref>.supabase.co
 * VITE_SUPABASE_PUBLISHABLE_KEY  sb_publishable_… (Project Settings → API Keys)
 *
 * A chave publicável pode ir para o navegador: o que cada pessoa lê ou grava é decidido
 * pelas regras (RLS) de supabase/migrations. Nunca use aqui a chave secreta (sb_secret_…).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = supabase !== null;

/** Tipo do erro devolvido por place_order / gatilhos (vai no "hint" da exceção). */
export type OrderErrorKind = "dados_invalidos" | "sem_estoque" | "cupom" | "entrega" | "pagamento";

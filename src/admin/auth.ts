import { useSyncExternalStore } from "react";
import { DEMO_ADMIN } from "@/admin/demo-credentials";
import { reloadDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";

/**
 * Sessão do painel.
 * - Supabase: login do Supabase Auth; só entra quem está em admin_users (função is_admin).
 * - Modo demonstração: senha conferida no navegador, dura até fechar a aba.
 *
 * Valor da sessão: undefined = ainda conferindo, null = fora, string = e-mail de quem entrou.
 */
type Session = string | null | undefined;

const KEY = "vf-admin-session";
const listeners = new Set<() => void>();
let session: Session = supabase ? undefined : readDemo();
const set = (s: Session) => {
  session = s;
  listeners.forEach((l) => l());
};

function readDemo(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Confere se a sessão do Supabase é de administradora e carrega os dados do painel. */
async function adopt(email: string | undefined): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) {
    await supabase.auth.signOut();
    return false;
  }
  await reloadDb();
  set(email ?? "");
  return true;
}

if (supabase) {
  const sb = supabase;
  void sb.auth.getSession().then(async ({ data }) => {
    if (!data.session || !(await adopt(data.session.user.email))) set(null);
  });
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      set(null);
      void reloadDb();
    }
  });
}

export function useAdminSession(): Session {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => session,
  );
}

/** Entra no painel. Devolve null se deu certo, ou a mensagem de erro. */
export async function login(email: string, password: string): Promise<string | null> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      return error.status === 400 || error.code === "invalid_credentials"
        ? "E-mail ou senha incorretos."
        : "Não foi possível entrar agora. Tente de novo.";
    }
    return (await adopt(data.user.email)) ? null : "Este acesso não tem permissão para o painel.";
  }
  const ok = email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
  if (!ok) return "E-mail ou senha incorretos.";
  window.sessionStorage.setItem(KEY, DEMO_ADMIN.email);
  set(DEMO_ADMIN.email);
  return null;
}

export async function logout() {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  window.sessionStorage.removeItem(KEY);
  set(null);
}

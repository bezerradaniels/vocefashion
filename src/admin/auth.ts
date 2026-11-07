import { useSyncExternalStore } from "react";
import { DEMO_ADMIN } from "@/admin/demo-credentials";
import { reloadDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { pageUrl } from "@/lib/asset";

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

/** Rota que recebe o link do e-mail de recuperação. */
export const RECOVERY_PATH = "/admin/nova-senha";

/** Envia o e-mail com o link para criar uma nova senha. Devolve null ou a mensagem de erro. */
export async function requestPasswordReset(email: string): Promise<string | null> {
  if (!supabase) return "No modo demonstração não há recuperação de senha.";
  const redirectTo = new URL(pageUrl(RECOVERY_PATH), window.location.origin).href;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (!error) return null;
  return error.status === 429
    ? "Muitos pedidos seguidos. Espere alguns minutos e tente de novo."
    : "Não foi possível enviar o e-mail agora. Tente de novo.";
}

/** Há sessão vinda do link de recuperação? (o cliente do Supabase lê o link ao abrir a página) */
export async function hasRecoverySession(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/** Grava a nova senha e entra no painel. Devolve null ou a mensagem de erro. */
export async function setNewPassword(password: string): Promise<string | null> {
  if (!supabase) return "No modo demonstração não há recuperação de senha.";
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return "Use uma senha diferente da anterior.";
    if (error.code === "weak_password") return "Senha fraca: use pelo menos 8 caracteres, misturando letras e números.";
    return "Não foi possível salvar a senha. Peça um novo link e tente de novo.";
  }
  return (await adopt(data.user.email)) ? null : "Senha salva, mas este acesso não tem permissão para o painel.";
}

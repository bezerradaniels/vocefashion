import { useSyncExternalStore } from "react";
import { DEMO_ADMIN } from "@/admin/demo-credentials";

/** Sessão do painel (modo demonstração): dura até fechar a aba. */
const KEY = "vf-admin-session";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function useAdminSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
  );
}

export function login(email: string, password: string) {
  const ok = email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
  if (ok) {
    window.sessionStorage.setItem(KEY, DEMO_ADMIN.email);
    emit();
  }
  return ok;
}

export function logout() {
  window.sessionStorage.removeItem(KEY);
  emit();
}

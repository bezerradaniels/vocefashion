import { useSyncExternalStore } from "react";

// Estado da gaveta da sacola, compartilhado entre o header, a página de produto e o Root.
let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openBag() {
  if (open) return;
  open = true;
  emit();
}

export function closeBag() {
  if (!open) return;
  open = false;
  emit();
}

export function useBagDrawerOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
}

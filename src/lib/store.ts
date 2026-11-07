import { useSyncExternalStore } from "react";
import { SIZES, type Size } from "@/data/catalog";
import { getProducts, useProducts } from "@/lib/db";

/**
 * Sacola e favoritos compartilhados entre as telas e persistidos em localStorage.
 */

export type BagItem = { pid: number; size: Size; qty: number };
type StoreState = { bag: BagItem[]; wish: Record<number, boolean> };

const KEY = "vf-store-v1";
const EMPTY: StoreState = { bag: [], wish: {} };

let state: StoreState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): StoreState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Partial<StoreState>;
  const bag = Array.isArray(r.bag)
    ? r.bag.filter(
        (b): b is BagItem =>
          !!b &&
          getProducts().some((p) => p.id === b.pid) &&
          (SIZES as readonly string[]).includes(b.size) &&
          Number.isInteger(b.qty) &&
          b.qty > 0,
      )
    : [];
  const wish: Record<number, boolean> = {};
  if (r.wish && typeof r.wish === "object") {
    for (const [k, v] of Object.entries(r.wish)) if (v === true) wish[Number(k)] = true;
  }
  return { bag, wish };
}

function readStorage() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStorage();
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = readStorage();
    listeners.forEach((l) => l());
  });
}

function update(fn: (s: StoreState) => StoreState) {
  ensureLoaded();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Navegação privada / armazenamento cheio: segue só em memória.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}


/** Peças disponíveis de um produto num tamanho (0 se o produto não existe). */
function stockOf(pid: number, size: Size) {
  return getProducts().find((p) => p.id === pid)?.stock[size] ?? 0;
}

export const actions = {
  toggleWish(id: number) {
    update((s) => {
      const wish = { ...s.wish };
      if (wish[id]) delete wish[id];
      else wish[id] = true;
      return { ...s, wish };
    });
  },
  /**
   * Soma 1 peça. Devolve false (e não muda nada) se a sacola já tem todo o estoque do tamanho.
   */
  addToBag(pid: number, size: Size): boolean {
    ensureLoaded();
    const inBag = state.bag.find((b) => b.pid === pid && b.size === size)?.qty ?? 0;
    if (inBag + 1 > stockOf(pid, size)) return false;
    update((s) => {
      const bag = [...s.bag];
      const i = bag.findIndex((b) => b.pid === pid && b.size === size);
      if (i >= 0) bag[i] = { ...bag[i], qty: bag[i].qty + 1 };
      else bag.push({ pid, size, qty: 1 });
      return { ...s, bag };
    });
    return true;
  },
  /** Quantidade 0 remove o item. */
  changeQty(index: number, delta: number) {
    update((s) => {
      const bag = [...s.bag];
      const item = bag[index];
      if (!item) return s;
      const qty = item.qty + delta;
      // Aumentar não passa do estoque do tamanho (diminuir é sempre permitido).
      if (delta > 0 && qty > stockOf(item.pid, item.size)) return s;
      if (qty <= 0) bag.splice(index, 1);
      else bag[index] = { ...item, qty };
      return { ...s, bag };
    });
  },
  clearBag() {
    update((s) => ({ ...s, bag: [] }));
  },
};

/**
 * Itens da sacola já com o produto, mais quantidade total e subtotal.
 * `stock` é o disponível agora: se o admin baixar o estoque, `qty > stock` marca o item.
 */
export function useBagLines() {
  const { bag } = useStore();
  const products = useProducts();
  // Peças desativadas ou removidas no admin somem da sacola.
  const lines = bag.flatMap((b, index) => {
    const product = products.find((p) => p.id === b.pid && p.active);
    return product ? [{ ...b, index, product, stock: product.stock[b.size] }] : [];
  });
  return {
    lines,
    /** Algum item pede mais peças do que há em estoque (o pedido não pode ser fechado). */
    overStock: lines.some((l) => l.qty > l.stock),
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.product.price * l.qty, 0),
  };
}

export function useBagCount() {
  return useBagLines().count;
}

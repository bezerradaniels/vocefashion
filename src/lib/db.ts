import { useSyncExternalStore } from "react";
import {
  SEED_CATEGORIES,
  SEED_COUPONS,
  SEED_HERO,
  SEED_PRODUCTS,
  SEED_SETTINGS,
  type Category,
  type Coupon,
  type Hero,
  type Order,
  type OrderStatus,
  type Product,
  type Settings,
} from "@/data/catalog";
import { seedOrders } from "@/data/seed-orders";

/**
 * "Banco de dados" da loja, salvo no localStorage deste navegador (modo demonstração).
 * Loja e admin leem daqui. Para ir para produção, troque a implementação deste arquivo
 * por chamadas ao Supabase mantendo os mesmos nomes de hooks e ações.
 */

export type DB = {
  version: 1;
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  orders: Order[];
  settings: Settings;
  hero: Hero;
  nextProductId: number;
  nextOrderNumber: number;
};

// v2: catálogo com as fotos reais da cliente (troque a versão quando o seed mudar).
const KEY = "vf-db-v2";

function seed(): DB {
  return {
    version: 1,
    products: SEED_PRODUCTS,
    categories: SEED_CATEGORIES,
    coupons: SEED_COUPONS,
    orders: seedOrders(),
    settings: SEED_SETTINGS,
    hero: SEED_HERO,
    nextProductId: Math.max(...SEED_PRODUCTS.map((p) => p.id)) + 1,
    nextOrderNumber: 2612,
  };
}

let state: DB | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): DB {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed?.version === 1) return { ...seed(), ...parsed };
    }
  } catch {
    // dado corrompido: volta ao seed
  }
  return seed();
}

function get(): DB {
  if (!state) {
    // Versões antigas do seed não servem mais: libera o espaço.
    try {
      window.localStorage.removeItem("vf-db-v1");
    } catch {
      // sem acesso ao storage
    }
    state = read();
    window.addEventListener("storage", (e) => {
      if (e.key !== KEY) return;
      state = read();
      emit();
    });
  }
  return state;
}

export class StorageFullError extends Error {
  constructor() {
    super("Sem espaço no navegador para salvar. Use imagens menores ou remova algumas fotos.");
  }
}

function update(fn: (db: DB) => DB) {
  const next = fn(get());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new StorageFullError();
  }
  state = next;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Lê um pedaço do banco. O seletor deve devolver um campo direto (sem filtrar/mapear). */
function useDB<T>(select: (db: DB) => T): T {
  return useSyncExternalStore(subscribe, () => select(get()));
}

export const useProducts = () => useDB((d) => d.products);
export const useCategories = () => useDB((d) => d.categories);
export const useCoupons = () => useDB((d) => d.coupons);
export const useOrders = () => useDB((d) => d.orders);
export const useSettings = () => useDB((d) => d.settings);
export const useHero = () => useDB((d) => d.hero);

export const getProducts = () => get().products;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class OutOfStockError extends Error {
  items: string[];
  constructor(items: string[]) {
    super(`Sem estoque suficiente: ${items.join(", ")}. Ajuste a sacola para continuar.`);
    this.items = items;
  }
}

export type NewOrder = Omit<Order, "id" | "number" | "createdAt" | "status">;

export const dbActions = {
  // Produtos
  saveProduct(p: Omit<Product, "id" | "createdAt"> & { id?: number; createdAt?: string }): number {
    let id = p.id ?? 0;
    update((d) => {
      if (p.id) {
        return { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, ...p, id: x.id } : x)) };
      }
      id = d.nextProductId;
      const created: Product = { ...p, id, createdAt: new Date().toISOString() } as Product;
      return { ...d, products: [created, ...d.products], nextProductId: id + 1 };
    });
    return id;
  },
  deleteProduct(id: number) {
    update((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
  },

  // Categorias
  saveCategory(c: Omit<Category, "id"> & { id?: string }) {
    update((d) => {
      if (c.id && d.categories.some((x) => x.id === c.id))
        return { ...d, categories: d.categories.map((x) => (x.id === c.id ? { ...x, ...c } as Category : x)) };
      return { ...d, categories: [...d.categories, { ...c, id: c.id ?? uid() } as Category] };
    });
  },
  moveCategory(id: string, dir: -1 | 1) {
    update((d) => {
      const list = [...d.categories];
      const i = list.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return d;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, categories: list };
    });
  },
  deleteCategory(id: string) {
    update((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
  },

  // Cupons
  saveCoupon(c: Omit<Coupon, "id" | "used"> & { id?: string; used?: number }) {
    update((d) => {
      if (c.id && d.coupons.some((x) => x.id === c.id))
        return { ...d, coupons: d.coupons.map((x) => (x.id === c.id ? { ...x, ...c } as Coupon : x)) };
      return { ...d, coupons: [...d.coupons, { ...c, id: uid(), used: 0 } as Coupon] };
    });
  },
  deleteCoupon(id: string) {
    update((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
  },

  // Pedidos
  /**
   * Cria o pedido, baixa o estoque e conta o uso do cupom.
   * Confere o estoque na hora (outra aba ou o admin pode ter mudado): falta de peça = OutOfStockError.
   */
  createOrder(input: NewOrder): Order {
    let order!: Order;
    update((d) => {
      const missing = input.items.filter((i) => {
        const p = d.products.find((x) => x.id === i.pid);
        const wanted = input.items.filter((x) => x.pid === i.pid && x.size === i.size).reduce((n, x) => n + x.qty, 0);
        return !p || p.stock[i.size] < wanted;
      });
      if (missing.length) throw new OutOfStockError(missing.map((i) => `${i.name} (${i.size})`));
      order = {
        ...input,
        id: uid(),
        number: `VF-${d.nextOrderNumber}`,
        createdAt: new Date().toISOString(),
        status: "aguardando_pagamento",
      };
      const products = d.products.map((p) => {
        const items = input.items.filter((i) => i.pid === p.id);
        if (!items.length) return p;
        const stock = { ...p.stock };
        for (const i of items) stock[i.size] = Math.max(0, stock[i.size] - i.qty);
        return { ...p, stock };
      });
      const coupons = input.couponCode
        ? d.coupons.map((c) => (c.code === input.couponCode ? { ...c, used: c.used + 1 } : c))
        : d.coupons;
      return { ...d, orders: [order, ...d.orders], products, coupons, nextOrderNumber: d.nextOrderNumber + 1 };
    });
    return order;
  },
  /** Cancelar devolve as peças ao estoque; sair de "cancelado" baixa de novo. */
  setOrderStatus(id: string, status: OrderStatus) {
    update((d) => {
      const order = d.orders.find((o) => o.id === id);
      if (!order || order.status === status) return d;
      const sign = status === "cancelado" ? 1 : order.status === "cancelado" ? -1 : 0;
      const products = sign
        ? d.products.map((p) => {
            const items = order.items.filter((i) => i.pid === p.id);
            if (!items.length) return p;
            const stock = { ...p.stock };
            for (const i of items) stock[i.size] = Math.max(0, stock[i.size] + sign * i.qty);
            return { ...p, stock };
          })
        : d.products;
      return { ...d, products, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) };
    });
  },

  // Loja
  saveSettings(settings: Settings) {
    update((d) => ({ ...d, settings }));
  },
  saveHero(hero: Hero) {
    update((d) => ({ ...d, hero }));
  },

  /** Volta tudo aos dados de demonstração. */
  resetDemo() {
    update(() => seed());
  },
};

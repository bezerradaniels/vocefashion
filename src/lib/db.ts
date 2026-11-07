import { useSyncExternalStore } from "react";
import {
  applyCoupon,
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
import type { ResizeOptions } from "@/admin/image";
import * as remote from "@/lib/db-supabase";
import { supabase } from "@/lib/supabase";

/**
 * "Banco de dados" da loja. Loja e painel leem daqui pelos hooks (useProducts…) e gravam
 * pelas ações (dbActions, todas assíncronas).
 *
 * - Com o Supabase configurado (src/lib/supabase.ts): lê e grava no banco.
 * - Sem ele: modo demonstração, salvo no localStorage deste navegador.
 */

export { DbError } from "@/lib/db-supabase";
export type { Receipt } from "@/lib/db-supabase";

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

export const DEMO_MODE = !supabase;

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

/** Antes de o Supabase responder: nada de catálogo de exemplo na tela. */
function empty(): DB {
  return {
    version: 1,
    products: [],
    categories: [],
    coupons: [],
    orders: [],
    settings: SEED_SETTINGS,
    hero: { ...SEED_HERO, enabled: false },
    nextProductId: 1,
    nextOrderNumber: 1,
  };
}

// ---------------------------------------------------------------------------
// Estado em memória + assinatura (useSyncExternalStore)
// ---------------------------------------------------------------------------

export type DbStatus = "loading" | "ready" | "error";

let state: DB | null = null;
let status: DbStatus = DEMO_MODE ? "ready" : "loading";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readLocal(): DB {
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
  if (state) return state;
  if (DEMO_MODE) {
    // Versões antigas do seed não servem mais: libera o espaço.
    try {
      window.localStorage.removeItem("vf-db-v1");
    } catch {
      // sem acesso ao storage
    }
    state = readLocal();
    window.addEventListener("storage", (e) => {
      if (e.key !== KEY) return;
      state = readLocal();
      emit();
    });
  } else {
    state = empty();
    void reloadDb();
  }
  return state;
}

export class StorageFullError extends Error {
  constructor() {
    super("Sem espaço no navegador para salvar. Use imagens menores ou remova algumas fotos.");
  }
}

/** Modo demonstração: aplica a mudança e grava no localStorage. */
function updateLocal(fn: (db: DB) => DB) {
  const next = fn(get());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new StorageFullError();
  }
  state = next;
  emit();
}

/**
 * Supabase: lê tudo de novo (depois de gravar, ao entrar/sair do painel).
 * Com sessão de administradora, traz também ocultos, cupons e pedidos.
 */
export function reloadDb(): Promise<void> {
  if (!supabase) return Promise.resolve();
  const sb = supabase;
  return (async () => {
    try {
      const { data } = await sb.auth.getSession();
      const loaded = await remote.loadAll(sb, !!data.session);
      state = { ...(state ?? empty()), ...loaded };
      status = "ready";
    } catch {
      // Já carregado antes: mantém o que há na tela. Primeira carga: mostra o erro.
      if (status !== "ready") status = "error";
    }
    emit();
  })();
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

/** "loading" até a primeira leitura do Supabase; no modo demonstração, sempre "ready". */
export function useDbStatus(): DbStatus {
  return useSyncExternalStore(subscribe, () => {
    get();
    return status;
  });
}

export const getProducts = () => get().products;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type NewOrder = Omit<Order, "id" | "number" | "createdAt" | "status">;

export class OutOfStockError extends Error {
  items: string[];
  constructor(items: string[]) {
    super(`Sem estoque suficiente: ${items.join(", ")}. Ajuste a sacola para continuar.`);
    this.items = items;
  }
}

/** Grava no Supabase e recarrega; sem Supabase, roda a versão local. */
async function write<T>(online: (sb: NonNullable<typeof supabase>) => Promise<T>, local: () => T): Promise<T> {
  if (!supabase) return local();
  const result = await online(supabase);
  await reloadDb();
  return result;
}

export type CouponCheck = remote.CouponCheck;

export const dbActions = {
  // Produtos
  saveProduct(p: remote.ProductInput): Promise<number> {
    return write(
      (sb) => remote.saveProduct(sb, p),
      () => {
        let id = p.id ?? 0;
        updateLocal((d) => {
          if (p.id) {
            return { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, ...p, id: x.id } : x)) };
          }
          id = d.nextProductId;
          const created: Product = { ...p, id, createdAt: new Date().toISOString() } as Product;
          return { ...d, products: [created, ...d.products], nextProductId: id + 1 };
        });
        return id;
      },
    );
  },
  deleteProduct(id: number) {
    return write(
      (sb) => remote.deleteProduct(sb, id),
      () => updateLocal((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) })),
    );
  },

  // Categorias
  saveCategory(c: Omit<Category, "id"> & { id?: string }) {
    const isNew = !c.id || !get().categories.some((x) => x.id === c.id);
    const full = { ...c, id: c.id ?? uid() } as Category;
    return write(
      (sb) => remote.saveCategory(sb, full, isNew),
      () =>
        updateLocal((d) =>
          isNew
            ? { ...d, categories: [...d.categories, full] }
            : { ...d, categories: d.categories.map((x) => (x.id === c.id ? { ...x, ...c } as Category : x)) },
        ),
    );
  },
  moveCategory(id: string, dir: -1 | 1) {
    const ids = get().categories.map((c) => c.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return Promise.resolve();
    return write(
      (sb) => remote.swapCategories(sb, ids, i, j),
      () =>
        updateLocal((d) => {
          const list = [...d.categories];
          [list[i], list[j]] = [list[j], list[i]];
          return { ...d, categories: list };
        }),
    );
  },
  deleteCategory(id: string) {
    return write(
      (sb) => remote.deleteCategory(sb, id),
      () => updateLocal((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) })),
    );
  },

  // Cupons
  saveCoupon(c: remote.CouponInput) {
    return write(
      (sb) => remote.saveCoupon(sb, c),
      () =>
        updateLocal((d) => {
          if (c.id && d.coupons.some((x) => x.id === c.id))
            return { ...d, coupons: d.coupons.map((x) => (x.id === c.id ? { ...x, ...c } as Coupon : x)) };
          return { ...d, coupons: [...d.coupons, { ...c, id: uid(), used: 0 } as Coupon] };
        }),
    );
  },
  deleteCoupon(id: string) {
    return write(
      (sb) => remote.deleteCoupon(sb, id),
      () => updateLocal((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) })),
    );
  },

  /** Confere um cupom para o subtotal da sacola (no Supabase, sem expor a lista de cupons). */
  async checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
    if (supabase) return remote.checkCoupon(supabase, code, subtotal);
    const r = applyCoupon(get().coupons, code, subtotal);
    return r.ok ? { ok: true, code: r.coupon.code, discount: r.discount } : r;
  },

  // Pedidos
  /**
   * Cria o pedido. No Supabase, preços, frete, cupom e desconto são recalculados no servidor
   * e o estoque é conferido e baixado na mesma transação; o recibo traz o total oficial.
   * Falta de peça = OutOfStockError.
   */
  async createOrder(input: NewOrder): Promise<remote.Receipt> {
    if (supabase) {
      try {
        const receipt = await remote.placeOrder(supabase, {
          customer: input.customer,
          delivery: {
            method_id: input.delivery.methodId,
            cep: input.delivery.cep,
            rua: input.delivery.rua,
            num: input.delivery.num,
            bairro: input.delivery.bairro,
            comp: input.delivery.comp,
          },
          payment: input.payment,
          items: input.items.map((i) => ({ product_id: i.pid, size: i.size, qty: i.qty })),
          coupon_code: input.couponCode,
        });
        return receipt;
      } finally {
        // Estoque mudou (ou o pedido falhou por estoque): atualiza a vitrine.
        void reloadDb();
      }
    }
    let order!: Order;
    updateLocal((d) => {
      // Confere o estoque na hora (outra aba ou o admin pode ter mudado).
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
    return { id: order.id, number: order.number, total: order.total };
  },
  /** Cancelar devolve as peças ao estoque; sair de "cancelado" baixa de novo. */
  setOrderStatus(id: string, status: OrderStatus) {
    return write(
      (sb) => remote.setOrderStatus(sb, id, status),
      () =>
        updateLocal((d) => {
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
        }),
    );
  },

  // Loja
  saveSettings(settings: Settings) {
    return write(
      (sb) => remote.saveSettings(sb, settings),
      () => updateLocal((d) => ({ ...d, settings })),
    );
  },
  saveHero(hero: Hero) {
    return write(
      (sb) => remote.saveHero(sb, hero),
      () => updateLocal((d) => ({ ...d, hero })),
    );
  },

  /** Reduz a foto e devolve o endereço: Storage no Supabase, data URL no modo demonstração. */
  async uploadImage(file: File, resize?: ResizeOptions): Promise<string> {
    const image = await import("@/admin/image");
    if (!supabase) return image.fileToResizedDataUrl(file, resize);
    const blob = await image.fileToResizedBlob(file, resize);
    return remote.uploadImage(supabase, blob);
  },

  /** Modo demonstração: volta tudo aos dados de exemplo. */
  async resetDemo() {
    if (supabase) return;
    updateLocal(() => seed());
  },
};

/** Mensagem para a tela a partir de um erro de gravação. */
export function errorMessage(err: unknown, fallback = "Não foi possível salvar. Tente de novo.") {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

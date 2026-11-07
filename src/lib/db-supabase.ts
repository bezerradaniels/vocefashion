/**
 * Leitura e gravação no Supabase. Converte as linhas do banco (snake_case,
 * ver supabase/migrations) para os tipos da loja (src/data/catalog.ts) e vice-versa.
 * Usado por src/lib/db.ts quando o Supabase está configurado.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  SIZES,
  type Category,
  type Coupon,
  type Hero,
  type Order,
  type OrderStatus,
  type Product,
  type Settings,
  type ShippingMethod,
  type Size,
} from "@/data/catalog";

// ---------------------------------------------------------------------------
// Linhas do banco
// ---------------------------------------------------------------------------

type CategoryRow = { id: string; name: string; active: boolean; position: number };
type StockRow = { size: Size; qty: number };
type ProductRow = {
  id: number;
  slug: string;
  category_id: string;
  name: string;
  price: number;
  old_price: number | null;
  description: string;
  description_more: string;
  photo_label: string;
  images: string[];
  active: boolean;
  created_at: string;
  product_stock: StockRow[];
};
type SettingsRow = {
  name: string;
  logo: string;
  description: string;
  phone: string;
  instagram: string;
  address: string;
  pix_enabled: boolean;
  pix_discount_percent: number;
  card_enabled: boolean;
  card_installments: number;
  local_cep_prefix: string;
  local_city_label: string;
};
type ShippingRow = {
  id: string;
  name: string;
  sub: string;
  price: number;
  enabled: boolean;
  scope: "local" | "national";
  pickup: boolean;
  free_above: number | null;
  position: number;
};
type HeroRow = {
  enabled: boolean;
  tag: string;
  title: string;
  cta: string;
  target: string;
  image: string;
  image_alt: string;
};
type CouponRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  used: number;
};
type OrderItemRow = { product_id: number | null; name: string; size: Size; qty: number; price: number };
type OrderRow = {
  id: string;
  number: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  shipping_method_id: string;
  shipping_method_name: string;
  pickup: boolean;
  cep: string;
  city: string;
  street: string;
  street_number: string;
  district: string;
  complement: string;
  payment: "pix" | "card";
  subtotal: number;
  shipping_cost: number;
  coupon_code: string | null;
  coupon_discount: number;
  pix_discount: number;
  total: number;
  order_items: OrderItemRow[];
};

const num = (v: number | string) => Number(v);

const toCategory = (r: CategoryRow): Category => ({ id: r.id, name: r.name, active: r.active });

function toProduct(r: ProductRow): Product {
  const stock = Object.fromEntries(SIZES.map((s) => [s, 0])) as Record<Size, number>;
  for (const s of r.product_stock ?? []) stock[s.size] = s.qty;
  return {
    id: r.id,
    slug: r.slug,
    categoryId: r.category_id,
    name: r.name,
    price: num(r.price),
    oldPrice: r.old_price === null ? null : num(r.old_price),
    stock,
    description: r.description,
    descriptionMore: r.description_more,
    photoLabel: r.photo_label,
    images: r.images ?? [],
    active: r.active,
    createdAt: r.created_at,
  };
}

const toMethod = (r: ShippingRow): ShippingMethod => ({
  id: r.id,
  name: r.name,
  sub: r.sub,
  price: num(r.price),
  enabled: r.enabled,
  scope: r.scope,
  pickup: r.pickup,
  freeAbove: r.free_above === null ? null : num(r.free_above),
});

const toSettings = (r: SettingsRow, methods: ShippingRow[]): Settings => ({
  name: r.name,
  logo: r.logo,
  description: r.description,
  phone: r.phone,
  instagram: r.instagram,
  address: r.address,
  payments: {
    pix: { enabled: r.pix_enabled, discountPercent: num(r.pix_discount_percent) },
    card: { enabled: r.card_enabled, installments: r.card_installments },
  },
  shipping: {
    localCepPrefix: r.local_cep_prefix,
    localCityLabel: r.local_city_label,
    methods: methods.map(toMethod),
  },
});

const toHero = (r: HeroRow): Hero => ({
  enabled: r.enabled,
  tag: r.tag,
  title: r.title,
  cta: r.cta,
  target: r.target,
  image: r.image,
  imageAlt: r.image_alt,
});

const toCoupon = (r: CouponRow): Coupon => ({
  id: r.id,
  code: r.code,
  type: r.type,
  value: num(r.value),
  minSubtotal: num(r.min_subtotal),
  active: r.active,
  expiresAt: r.expires_at,
  usageLimit: r.usage_limit,
  used: r.used,
});

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  number: r.number,
  createdAt: r.created_at,
  status: r.status,
  customer: { nome: r.customer_name, email: r.customer_email, cel: r.customer_phone, cpf: r.customer_cpf },
  delivery: {
    methodId: r.shipping_method_id,
    methodName: r.shipping_method_name,
    pickup: r.pickup,
    cep: r.cep,
    city: r.city,
    rua: r.street,
    num: r.street_number,
    bairro: r.district,
    comp: r.complement,
  },
  payment: r.payment,
  items: (r.order_items ?? []).map((i) => ({
    pid: i.product_id ?? 0,
    name: i.name,
    size: i.size,
    qty: i.qty,
    price: num(i.price),
  })),
  subtotal: num(r.subtotal),
  shippingCost: num(r.shipping_cost),
  couponCode: r.coupon_code,
  couponDiscount: num(r.coupon_discount),
  pixDiscount: num(r.pix_discount),
  total: num(r.total),
});

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------

/** Erro com mensagem pronta para mostrar na tela. `kind` vem do hint das funções do banco. */
export class DbError extends Error {
  kind: string | null;
  constructor(message: string, kind: string | null = null) {
    super(message);
    this.kind = kind;
  }
}

function fail(error: PostgrestError | null, fallback = "Não foi possível salvar. Tente de novo."): never {
  if (error?.code === "P0001") throw new DbError(error.message, error.hint || null);
  if (error?.code === "23505") throw new DbError("Já existe um registro com este nome ou código.");
  if (error?.code === "23514") throw new DbError("Algum valor está fora do permitido. Confira os campos.");
  if (error?.code === "23503") throw new DbError("Este item está em uso e não pode ser excluído.");
  if (error?.code === "42501" || error?.message?.includes("row-level security"))
    throw new DbError("Sua sessão não tem permissão para isso. Entre de novo no painel.");
  throw new DbError(fallback);
}

/** Lança DbError se a resposta tiver erro; senão devolve os dados. */
function ok<T>(res: { data: T | null; error: PostgrestError | null }, fallback?: string): T {
  if (res.error) fail(res.error, fallback);
  return res.data as T;
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export type Loaded = {
  products: Product[];
  categories: Category[];
  settings: Settings;
  hero: Hero;
  coupons: Coupon[];
  orders: Order[];
};

/**
 * Lê tudo o que a sessão atual pode ver. Visitante: só a vitrine (cupons e pedidos voltam
 * vazios pelo RLS). Administradora: também os ocultos, cupons e pedidos.
 */
export async function loadAll(sb: SupabaseClient, admin: boolean): Promise<Loaded> {
  const fallback = "Não foi possível carregar a loja. Confira a conexão e recarregue a página.";
  const [cats, prods, settings, methods, hero, coupons, orders] = await Promise.all([
    sb.from("categories").select("id,name,active,position").order("position").order("name"),
    sb.from("products").select("*,product_stock(size,qty)").order("created_at", { ascending: false }),
    sb.from("store_settings").select("*").single(),
    sb.from("shipping_methods").select("*").order("position"),
    sb.from("hero").select("*").single(),
    admin ? sb.from("coupons").select("*").order("code") : Promise.resolve({ data: [], error: null }),
    admin
      ? sb.from("orders").select("*,order_items(*)").order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  return {
    categories: ok(cats, fallback).map(toCategory),
    products: ok(prods, fallback).map(toProduct),
    settings: toSettings(ok(settings, fallback) as SettingsRow, ok(methods, fallback) as ShippingRow[]),
    hero: toHero(ok(hero, fallback) as HeroRow),
    coupons: (ok(coupons, fallback) as CouponRow[]).map(toCoupon),
    orders: (ok(orders, fallback) as OrderRow[]).map(toOrder),
  };
}

// ---------------------------------------------------------------------------
// Gravação (só administradoras, garantido pelo RLS)
// ---------------------------------------------------------------------------

export type ProductInput = Omit<Product, "id" | "createdAt"> & { id?: number; createdAt?: string };

export async function saveProduct(sb: SupabaseClient, p: ProductInput): Promise<number> {
  const row = {
    slug: p.slug,
    category_id: p.categoryId,
    name: p.name,
    price: p.price,
    old_price: p.oldPrice,
    description: p.description,
    description_more: p.descriptionMore,
    photo_label: p.photoLabel,
    images: p.images,
    active: p.active,
  };
  const id = p.id
    ? (ok(await sb.from("products").update(row).eq("id", p.id).select("id").single()) as { id: number }).id
    : (ok(await sb.from("products").insert(row).select("id").single()) as { id: number }).id;
  ok(
    await sb
      .from("product_stock")
      .upsert(SIZES.map((size) => ({ product_id: id, size, qty: p.stock[size] ?? 0 })), {
        onConflict: "product_id,size",
      }),
  );
  return id;
}

export async function deleteProduct(sb: SupabaseClient, id: number) {
  ok(await sb.from("products").delete().eq("id", id));
}

export async function saveCategory(sb: SupabaseClient, c: Category, isNew: boolean) {
  if (isNew) {
    const last = ok(
      await sb.from("categories").select("position").order("position", { ascending: false }).limit(1),
    ) as { position: number }[];
    ok(await sb.from("categories").insert({ ...c, position: (last[0]?.position ?? -1) + 1 }));
  } else {
    ok(await sb.from("categories").update({ name: c.name, active: c.active }).eq("id", c.id));
  }
}

/** Troca a posição de duas categorias vizinhas (ordem já vem da lista na tela). */
export async function swapCategories(sb: SupabaseClient, ids: string[], i: number, j: number) {
  // Reescreve as posições 0..n na ordem nova: corrige também posições repetidas.
  const order = [...ids];
  [order[i], order[j]] = [order[j], order[i]];
  const results = await Promise.all(
    order.map((id, position) => sb.from("categories").update({ position }).eq("id", id)),
  );
  for (const r of results) ok(r);
}

export async function deleteCategory(sb: SupabaseClient, id: string) {
  ok(await sb.from("categories").delete().eq("id", id));
}

export type CouponInput = Omit<Coupon, "id" | "used"> & { id?: string; used?: number };

export async function saveCoupon(sb: SupabaseClient, c: CouponInput) {
  const row = {
    code: c.code,
    type: c.type,
    value: c.value,
    min_subtotal: c.minSubtotal,
    active: c.active,
    expires_at: c.expiresAt,
    usage_limit: c.usageLimit,
  };
  ok(c.id ? await sb.from("coupons").update(row).eq("id", c.id) : await sb.from("coupons").insert(row));
}

export async function deleteCoupon(sb: SupabaseClient, id: string) {
  ok(await sb.from("coupons").delete().eq("id", id));
}

export async function setOrderStatus(sb: SupabaseClient, id: string, status: OrderStatus) {
  ok(await sb.from("orders").update({ status }).eq("id", id));
}

export async function saveSettings(sb: SupabaseClient, s: Settings) {
  ok(
    await sb
      .from("store_settings")
      .update({
        name: s.name,
        logo: s.logo,
        description: s.description,
        phone: s.phone,
        instagram: s.instagram,
        address: s.address,
        pix_enabled: s.payments.pix.enabled,
        pix_discount_percent: s.payments.pix.discountPercent,
        card_enabled: s.payments.card.enabled,
        card_installments: s.payments.card.installments,
        local_cep_prefix: s.shipping.localCepPrefix,
        local_city_label: s.shipping.localCityLabel,
      })
      .eq("id", true),
  );
  const methods = s.shipping.methods;
  ok(
    await sb.from("shipping_methods").upsert(
      methods.map((m, position) => ({
        id: m.id,
        name: m.name,
        sub: m.sub,
        price: m.price,
        enabled: m.enabled,
        // Retirada é sempre local (regra do banco).
        scope: m.pickup ? "local" : m.scope,
        pickup: m.pickup,
        free_above: m.freeAbove,
        position,
      })),
      { onConflict: "id" },
    ),
  );
  const keep = methods.map((m) => m.id);
  const removed = keep.length
    ? await sb.from("shipping_methods").delete().not("id", "in", `(${keep.map((id) => `"${id}"`).join(",")})`)
    : await sb.from("shipping_methods").delete().neq("id", "");
  ok(removed);
}

export async function saveHero(sb: SupabaseClient, h: Hero) {
  ok(
    await sb
      .from("hero")
      .update({
        enabled: h.enabled,
        tag: h.tag,
        title: h.title,
        cta: h.cta,
        target: h.target,
        image: h.image,
        image_alt: h.imageAlt,
      })
      .eq("id", true),
  );
}

// ---------------------------------------------------------------------------
// Checkout (visitante): funções do banco
// ---------------------------------------------------------------------------

export type CouponCheck = { ok: true; code: string; discount: number } | { ok: false; error: string };

export async function checkCoupon(sb: SupabaseClient, code: string, subtotal: number): Promise<CouponCheck> {
  const r = ok(
    await sb.rpc("check_coupon", { p_code: code, p_subtotal: subtotal }),
    "Não foi possível conferir o cupom agora.",
  ) as { ok: boolean; code?: string; discount?: number; error?: string };
  return r.ok ? { ok: true, code: r.code as string, discount: num(r.discount as number) } : { ok: false, error: r.error ?? "Cupom inválido" };
}

export type OrderPayload = {
  customer: { nome: string; email: string; cel: string; cpf: string };
  delivery: { method_id: string; cep: string; rua: string; num: string; bairro: string; comp: string };
  payment: "pix" | "card";
  items: { product_id: number; size: Size; qty: number }[];
  coupon_code: string | null;
};

export type Receipt = { id: string; number: string; total: number };

export async function placeOrder(sb: SupabaseClient, payload: OrderPayload): Promise<Receipt> {
  const r = ok(
    await sb.rpc("place_order", { payload }),
    "Não foi possível registrar o pedido. Tente de novo.",
  ) as { id: string; number: string; total: number };
  return { id: r.id, number: r.number, total: num(r.total) };
}

// ---------------------------------------------------------------------------
// Fotos (Storage)
// ---------------------------------------------------------------------------

/** Envia a foto (já reduzida) ao bucket "produtos" e devolve o endereço público. */
export async function uploadImage(sb: SupabaseClient, blob: Blob): Promise<string> {
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage
    .from("produtos")
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw new DbError("Não foi possível enviar a foto. Tente de novo.");
  return sb.storage.from("produtos").getPublicUrl(path).data.publicUrl;
}

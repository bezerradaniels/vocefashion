/**
 * Tipos, dados iniciais (seed) e regras de negócio da loja.
 * Os dados "vivos" ficam em src/lib/db.ts (hoje no navegador; depois, no Supabase).
 */

import { brl } from "@/lib/format";

export const SIZES = ["P", "M", "G", "GG"] as const;
export type Size = (typeof SIZES)[number];

export type Category = {
  id: string;
  name: string;
  active: boolean;
};

export type Product = {
  id: number;
  slug: string;
  categoryId: string;
  name: string;
  price: number;
  /** Preço "de" (riscado). Preenchido = produto em promoção. */
  oldPrice: number | null;
  stock: Record<Size, number>;
  description: string;
  descriptionMore: string;
  /** Rótulo do placeholder enquanto não houver fotos reais. */
  photoLabel: string;
  /** Fotos 4:5 (frente, costas, detalhe). Vazio = placeholder listrado. */
  images: string[];
  active: boolean;
  createdAt: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  sub: string;
  price: number;
  enabled: boolean;
  /** "local": só para CEPs da cidade. "national": qualquer CEP. */
  scope: "local" | "national";
  /** Retirada: não pede endereço. */
  pickup: boolean;
  /** Grátis a partir deste subtotal (null = nunca). */
  freeAbove: number | null;
};

export type Settings = {
  name: string;
  logo: string;
  description: string;
  /** WhatsApp/telefone, só dígitos com DDD. */
  phone: string;
  /** Usuário do Instagram, sem @. */
  instagram: string;
  address: string;
  payments: {
    /** expiryMinutes: prazo para pagar antes do cancelamento automático (0 = desligado). */
    pix: { enabled: boolean; discountPercent: number; expiryMinutes: number };
    card: { enabled: boolean; installments: number };
  };
  shipping: {
    localCepPrefix: string;
    localCityLabel: string;
    methods: ShippingMethod[];
  };
};

/** Destino do botão do banner e das pílulas da vitrine. */
export type ShelfKey = "novidades" | "promocao" | (string & {});

export type Hero = {
  enabled: boolean;
  tag: string;
  /** Até ~30 caracteres: o banner tem altura fixa e mostra no máximo 3 linhas. */
  title: string;
  cta: string;
  target: ShelfKey;
  /** Foto 4:5 (feed do Instagram, 1080×1350). Vazio = placeholder. */
  image: string;
  imageAlt: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  active: boolean;
  /** AAAA-MM-DD, válido até o fim do dia. */
  expiresAt: string | null;
  usageLimit: number | null;
  used: number;
};

export const ORDER_STATUSES = [
  "aguardando_pagamento",
  "pago",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export type OrderItem = { pid: number; name: string; size: Size; qty: number; price: number };

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: { nome: string; email: string; cel: string; cpf: string };
  delivery: {
    methodId: string;
    methodName: string;
    pickup: boolean;
    cep: string;
    city: string;
    rua: string;
    num: string;
    bairro: string;
    comp: string;
  };
  payment: "pix" | "card";
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  couponCode: string | null;
  couponDiscount: number;
  pixDiscount: number;
  total: number;
  /** Quando o sistema cancelou o pedido por falta de pagamento do Pix (null = não foi). */
  autoCancelledAt?: string | null;
};

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

export const SEED_CATEGORIES: Category[] = [
  { id: "vestidos", name: "Vestidos", active: true },
  { id: "blusas", name: "Blusas", active: true },
  { id: "calcas", name: "Calças", active: true },
];

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** Fotos em public/produtos/<slug>/01.webp, 02.webp… (01 = capa). */
const photos = (slug: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/produtos/${slug}/${String(i + 1).padStart(2, "0")}.webp`);

/*
 * Produtos de demonstração montados a partir das fotos enviadas pela cliente.
 * Nomes, preços, estoque e textos são ilustrativos: ajuste pelo painel.
 */
export const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "vestido-longo-frente-unica-listrado-azul",
    categoryId: "vestidos",
    name: "Vestido Longo Frente Única Listrado",
    price: 229.9,
    oldPrice: null,
    stock: { P: 2, M: 3, G: 2, GG: 1 },
    description:
      "Vestido longo frente única, com alças finas amarradas no pescoço e listras em azul e off-white. O recorte baixo abre numa saia rodada com babado, leve para os dias de calor.",
    descriptionMore:
      "Costas abertas com amarração. Fica lindo com rasteirinha de dia ou sandália de salto à noite.",
    photoLabel: "foto · vestido listrado azul",
    images: photos("vestido-longo-frente-unica-listrado-azul", 8),
    active: true,
    createdAt: day(0),
  },
  {
    id: 2,
    slug: "vestido-curto-frente-unica-chocolate",
    categoryId: "vestidos",
    name: "Vestido Curto Frente Única Chocolate",
    price: 179.9,
    oldPrice: null,
    stock: { P: 1, M: 2, G: 2, GG: 0 },
    description:
      "Vestido curto frente única na cor chocolate, com argola dourada no decote e recorte na cintura baixa. A saia franzida dá movimento e valoriza a silhueta.",
    descriptionMore:
      "Costas nuas com laço de amarração. Combina com sandália de amarrar dourada para uma noite especial.",
    photoLabel: "foto · vestido curto chocolate",
    images: photos("vestido-curto-frente-unica-chocolate", 8),
    active: true,
    createdAt: day(1),
  },
  {
    id: 3,
    slug: "vestido-curto-frente-unica-rosa",
    categoryId: "vestidos",
    name: "Vestido Curto Frente Única Rosa",
    price: 129.9,
    oldPrice: 149.9,
    stock: { P: 2, M: 3, G: 1, GG: 1 },
    description:
      "Vestido curto rosa com decote frente única drapeado e gota no centro. Saia em camadas com babado, fresquinho para o dia a dia.",
    descriptionMore: "Amarração no pescoço para ajustar. Vai bem com rasteirinha dourada.",
    photoLabel: "foto · vestido curto rosa",
    images: photos("vestido-curto-frente-unica-rosa", 8),
    active: true,
    createdAt: day(2),
  },
  {
    id: 4,
    slug: "blusa-capa-cropped-off-white",
    categoryId: "blusas",
    name: "Blusa Capa Cropped Off-White",
    price: 119.9,
    oldPrice: null,
    stock: { P: 3, M: 3, G: 2, GG: 1 },
    description:
      "Blusa cropped em tecido fluido, com mangas em capa abertas nas laterais e decote canoa. Caimento leve que deixa qualquer look mais elegante.",
    descriptionMore: "Na foto, combinada com short de alfaiataria chocolate com cinto.",
    photoLabel: "foto · blusa capa off-white",
    images: photos("blusa-capa-cropped-off-white", 8),
    active: true,
    createdAt: day(3),
  },
  {
    id: 5,
    slug: "blusa-ombro-so-assimetrica-chocolate",
    categoryId: "blusas",
    name: "Blusa Ombro Só Assimétrica Chocolate",
    price: 99.9,
    oldPrice: 119.9,
    stock: { P: 1, M: 2, G: 1, GG: 0 },
    description:
      "Blusa de um ombro só com caimento assimétrico em capa, na cor chocolate. Movimento bonito e visual elegante sem esforço.",
    descriptionMore: "Na foto, combinada com short de alfaiataria off-white.",
    photoLabel: "foto · blusa ombro só chocolate",
    images: photos("blusa-ombro-so-assimetrica-chocolate", 8),
    active: true,
    createdAt: day(4),
  },
  {
    id: 6,
    slug: "blusa-frente-unica-assimetrica-marinho",
    categoryId: "blusas",
    name: "Blusa Frente Única Assimétrica Marinho",
    price: 109.9,
    oldPrice: null,
    stock: { P: 2, M: 2, G: 1, GG: 1 },
    description:
      "Blusa frente única de gola alta, com babado assimétrico que cai até o quadril. Azul-marinho intenso, ótima com short ou calça de alfaiataria.",
    descriptionMore: "Costas abertas. Na foto, com short de alfaiataria cinza.",
    photoLabel: "foto · blusa marinho",
    images: photos("blusa-frente-unica-assimetrica-marinho", 3),
    active: true,
    createdAt: day(5),
  },
  {
    id: 7,
    slug: "calca-jeans-wide-leg-recortes",
    categoryId: "calcas",
    name: "Calça Jeans Wide Leg com Recortes",
    price: 189.9,
    oldPrice: null,
    stock: { P: 2, M: 3, G: 3, GG: 1 },
    description:
      "Calça jeans wide leg de cintura alta, com recortes verticais na frente e bolsos embutidos. Lavagem média, confortável e alonga a silhueta.",
    descriptionMore: "Barra larga que cai sobre o sapato. Na foto, com top branco de alcinha.",
    photoLabel: "foto · calça jeans wide leg",
    images: photos("calca-jeans-wide-leg-recortes", 9),
    active: true,
    createdAt: day(6),
  },
];

export const SEED_SETTINGS: Settings = {
  name: "Você Fashion",
  logo: "/logo-voce-fashion.jpg",
  description:
    "Moda feminina em Bom Jesus da Lapa (BA). Loja física no Centro, com retirada em até 2h e entrega no mesmo dia na cidade.",
  phone: "",
  instagram: "",
  address: "Centro · Bom Jesus da Lapa — BA",
  payments: {
    pix: { enabled: true, discountPercent: 5, expiryMinutes: 120 },
    card: { enabled: true, installments: 3 },
  },
  shipping: {
    localCepPrefix: "476",
    localCityLabel: "Bom Jesus da Lapa — BA",
    methods: [
      {
        id: "retirada",
        name: "Retirar na loja",
        sub: "Centro · Bom Jesus da Lapa · pronto em 2h",
        price: 0,
        enabled: true,
        scope: "local",
        pickup: true,
        freeAbove: null,
      },
      {
        id: "moto",
        name: "Entrega Você Fashion",
        sub: "Motoboy · hoje até 19h",
        price: 7,
        enabled: true,
        scope: "local",
        pickup: false,
        freeAbove: 199,
      },
      {
        id: "pac",
        name: "Correios PAC",
        sub: "6 a 9 dias úteis",
        price: 22.9,
        enabled: true,
        scope: "national",
        pickup: false,
        freeAbove: null,
      },
      {
        id: "sedex",
        name: "Correios SEDEX",
        sub: "2 a 4 dias úteis",
        price: 39.9,
        enabled: true,
        scope: "national",
        pickup: false,
        freeAbove: null,
      },
    ],
  },
};

export const SEED_HERO: Hero = {
  enabled: true,
  tag: `Até ${Math.max(...SEED_PRODUCTS.map(discountPercent))}% off`,
  title: "Leveza para o calor da Lapa",
  cta: "Ver promoções",
  target: "promocao",
  image: "/banner/campanha.webp",
  imageAlt: "Modelo com vestido longo listrado azul e off-white",
};

export const SEED_COUPONS: Coupon[] = [
  {
    id: "c-bemvinda",
    code: "BEMVINDA10",
    type: "percent",
    value: 10,
    minSubtotal: 0,
    active: true,
    expiresAt: null,
    usageLimit: null,
    used: 3,
  },
  {
    id: "c-lapa20",
    code: "LAPA20",
    type: "fixed",
    value: 20,
    minSubtotal: 150,
    active: true,
    expiresAt: null,
    usageLimit: 50,
    used: 12,
  },
];

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

export function discountPercent(p: Pick<Product, "price" | "oldPrice">) {
  return p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}

export function isOnSale(p: Product) {
  return discountPercent(p) > 0;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Shelf = { key: ShelfKey; label: string };

/**
 * Pílulas da vitrine: Novidades + categorias ativas com peças + Promoção (se houver peça em promoção).
 * Categoria vazia não aparece, para a cliente não cair numa página sem produtos.
 */
export function storeShelves(categories: Category[], products: Product[]): Shelf[] {
  const visible = products.filter((p) => p.active);
  const shelves: Shelf[] = [{ key: "novidades", label: "Novidades" }];
  for (const c of categories)
    if (c.active && visible.some((p) => p.categoryId === c.id)) shelves.push({ key: c.id, label: c.name });
  if (visible.some(isOnSale)) shelves.push({ key: "promocao", label: "Promoção" });
  return shelves;
}

export function filterShelf(products: Product[], key: ShelfKey) {
  const visible = products.filter((p) => p.active);
  if (key === "novidades")
    return [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (key === "promocao") return visible.filter(isOnSale);
  return visible.filter((p) => p.categoryId === key);
}

/** Até quando um pedido Pix aguardando pagamento fica reservado (null = sem prazo). */
export function pixDeadline(order: Pick<Order, "payment" | "status" | "createdAt">, settings: Settings) {
  const minutes = settings.payments.pix.expiryMinutes;
  if (order.payment !== "pix" || order.status !== "aguardando_pagamento" || !(minutes > 0)) return null;
  return new Date(new Date(order.createdAt).getTime() + minutes * 60_000);
}

/** "2 horas", "30 minutos", "1 dia". */
export function formatMinutes(minutes: number) {
  if (minutes % 1440 === 0) return minutes === 1440 ? "1 dia" : `${minutes / 1440} dias`;
  if (minutes % 60 === 0) return minutes === 60 ? "1 hora" : `${minutes / 60} horas`;
  return `${minutes} minutos`;
}

export type ShippingOption = ShippingMethod & { finalPrice: number; note: string };

/** Opções de frete para o CEP informado (local = CEP da cidade). */
export function shippingOptions(settings: Settings, local: boolean, subtotal: number): ShippingOption[] {
  return settings.shipping.methods
    .filter((m) => m.enabled && (local || m.scope === "national"))
    .map((m) => {
      const free = m.freeAbove !== null && subtotal >= m.freeAbove;
      return {
        ...m,
        finalPrice: free ? 0 : m.price,
        note: free && m.price > 0 ? `${m.sub} · grátis acima de ${brl(m.freeAbove as number)}` : m.sub,
      };
    });
}

/** Menor valor para frete grátis entre as entregas locais ativas (para avisos na loja). */
export function freeDeliveryThreshold(settings: Settings) {
  const values = settings.shipping.methods
    .filter((m) => m.enabled && m.scope === "local" && !m.pickup && m.freeAbove !== null)
    .map((m) => m.freeAbove as number);
  return values.length ? Math.min(...values) : null;
}

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

export function applyCoupon(coupons: Coupon[], rawCode: string, subtotal: number): CouponResult {
  const code = rawCode.trim().toUpperCase();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code);
  if (!coupon || !coupon.active) return { ok: false, error: "Cupom não encontrado" };
  if (coupon.expiresAt && new Date(`${coupon.expiresAt}T23:59:59`) < new Date())
    return { ok: false, error: "Este cupom expirou" };
  if (coupon.usageLimit !== null && coupon.used >= coupon.usageLimit)
    return { ok: false, error: "Este cupom esgotou" };
  if (subtotal < coupon.minSubtotal)
    return {
      ok: false,
      error: `Válido para compras a partir de ${brl(coupon.minSubtotal)}`,
    };
  const discount =
    coupon.type === "percent" ? (subtotal * coupon.value) / 100 : Math.min(coupon.value, subtotal);
  return { ok: true, coupon, discount: Math.round(discount * 100) / 100 };
}

import type { OrderStatus } from "@/data/catalog";

/* Cores do painel (tokens em src/index.css). */

export type Tone = "neutral" | "copper" | "ok" | "info" | "danger" | "dark" | "warn" | "violet" | "teal";
/** Fundo claro + texto da mesma cor (badges, ícones dos indicadores). */
export const TONE: Record<Tone, string> = {
  neutral: "bg-chip text-charcoal",
  copper: "bg-copper-tint text-copper-active",
  ok: "bg-ok-tint text-ok",
  info: "bg-info-tint text-info",
  danger: "bg-error-tint text-error",
  dark: "bg-charcoal text-white",
  warn: "bg-warn-tint text-warn",
  violet: "bg-violet-tint text-violet",
  teal: "bg-teal-tint text-teal",
};

/** Uma cor por situação: dá para ler a lista de pedidos pela cor. */
export const STATUS_TONE: Record<OrderStatus, Tone> = {
  aguardando_pagamento: "warn",
  pago: "info",
  em_separacao: "violet",
  enviado: "teal",
  entregue: "ok",
  cancelado: "danger",
};

/** Cor cheia (bolinhas dos filtros, faixas dos indicadores). */
export const DOT: Record<Tone, string> = {
  neutral: "bg-line",
  copper: "bg-copper",
  ok: "bg-ok",
  info: "bg-info",
  danger: "bg-error",
  dark: "bg-charcoal",
  warn: "bg-warn",
  violet: "bg-violet",
  teal: "bg-teal",
};

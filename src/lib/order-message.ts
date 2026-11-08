import { brl } from "@/lib/format";

/** Resumo do pedido para a cliente mandar no WhatsApp/Instagram da loja (pagamento é combinado lá). */
export function orderMessage(o: {
  number: string;
  nome: string;
  items: { name: string; size: string; qty: number; price: number }[];
  subtotal: number;
  shippingName: string;
  shippingCost: number;
  pickup: boolean;
  address: string;
  couponCode: string | null;
  couponDiscount: number;
  pixDiscount: number;
  total: number;
  payment: "pix" | "card";
  installments: number;
}) {
  const lines = [
    `Olá! Fiz o pedido #${o.number} no site da Você Fashion e quero combinar o pagamento.`,
    "",
    ...o.items.map((i) => `• ${i.qty}x ${i.name} (tam. ${i.size}) — ${brl(i.price * i.qty)}`),
    "",
    `Subtotal: ${brl(o.subtotal)}`,
    `${o.pickup ? "Retirada" : "Entrega"}: ${o.shippingName} — ${o.shippingCost ? brl(o.shippingCost) : "grátis"}`,
    ...(o.couponDiscount > 0 ? [`Cupom ${o.couponCode ?? ""}: − ${brl(o.couponDiscount)}`] : []),
    ...(o.pixDiscount > 0 ? [`Desconto Pix: − ${brl(o.pixDiscount)}`] : []),
    `*Total: ${brl(o.total)}*`,
    "",
    `Pagamento preferido: ${o.payment === "pix" ? "Pix" : o.installments > 1 ? `cartão (até ${o.installments}x)` : "cartão"}`,
    ...(o.pickup ? [] : [`Endereço: ${o.address}`]),
    `Nome: ${o.nome}`,
  ];
  return lines.join("\n");
}

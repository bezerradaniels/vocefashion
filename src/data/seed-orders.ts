import { SEED_PRODUCTS, type Order, type OrderStatus, type Size } from "@/data/catalog";

/** Pedidos fictícios para o painel não começar vazio (modo demonstração). */
const CUSTOMERS = [
  ["Ana Souza", "ana.souza@exemplo.com", "(77) 99812-3401"],
  ["Beatriz Lima", "bia.lima@exemplo.com", "(77) 99925-1187"],
  ["Carla Menezes", "carla.m@exemplo.com", "(77) 98831-0042"],
  ["Daniela Rocha", "dani.rocha@exemplo.com", "(77) 99104-7763"],
  ["Eduarda Santos", "duda.santos@exemplo.com", "(71) 99655-2290"],
  ["Fernanda Alves", "fe.alves@exemplo.com", "(77) 99977-5512"],
  ["Gabriela Nunes", "gabi.nunes@exemplo.com", "(77) 98840-9931"],
  ["Helena Costa", "helena.c@exemplo.com", "(75) 99233-1408"],
] as const;

// [dias atrás, cliente, status, pagamento, frete, itens [produto, tamanho, qtd]]
const PLAN: [number, number, OrderStatus, "pix" | "card", "retirada" | "moto" | "pac", [number, Size, number][]][] = [
  [0, 0, "aguardando_pagamento", "pix", "moto", [[1, "M", 1]]],
  [0, 1, "pago", "card", "retirada", [[4, "P", 1], [6, "P", 1]]],
  [1, 2, "em_separacao", "pix", "moto", [[2, "M", 1]]],
  [2, 3, "enviado", "pix", "pac", [[7, "G", 1], [4, "M", 1]]],
  [3, 4, "entregue", "card", "moto", [[3, "G", 1]]],
  [4, 5, "entregue", "pix", "retirada", [[5, "M", 1]]],
  [6, 6, "cancelado", "pix", "moto", [[1, "P", 1]]],
  [8, 7, "entregue", "card", "pac", [[2, "P", 1], [3, "M", 1]]],
  [11, 0, "entregue", "pix", "moto", [[6, "G", 1]]],
  [13, 2, "entregue", "pix", "retirada", [[7, "M", 1]]],
];

const SHIP = {
  retirada: { name: "Retirar na loja", price: 0, pickup: true, local: true },
  moto: { name: "Entrega Você Fashion", price: 7, pickup: false, local: true },
  pac: { name: "Correios PAC", price: 22.9, pickup: false, local: false },
};

export function seedOrders(): Order[] {
  return PLAN.map(([daysAgo, ci, status, payment, shipId, items], i) => {
    const [nome, email, cel] = CUSTOMERS[ci];
    const lines = items.map(([pid, size, qty]) => {
      const p = SEED_PRODUCTS.find((x) => x.id === pid)!;
      return { pid, name: p.name, size, qty, price: p.price };
    });
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const ship = SHIP[shipId];
    const shippingCost = shipId === "moto" && subtotal >= 199 ? 0 : ship.price;
    const pixDiscount = payment === "pix" ? Math.round(subtotal * 5) / 100 : 0;
    const created = new Date(Date.now() - daysAgo * 86_400_000 - (i % 5) * 3_600_000);
    const number = 2611 - i;
    return {
      id: `seed-${number}`,
      number: `VF-${number}`,
      createdAt: created.toISOString(),
      status,
      customer: { nome, email, cel, cpf: "000.000.000-00" },
      delivery: {
        methodId: shipId,
        methodName: ship.name,
        pickup: ship.pickup,
        cep: ship.local ? "47600-000" : "40015-970",
        city: ship.local ? "Bom Jesus da Lapa — BA" : "Salvador — BA",
        rua: ship.pickup ? "" : "Rua Exemplo",
        num: ship.pickup ? "" : String(100 + i * 7),
        bairro: ship.pickup ? "" : "Centro",
        comp: "",
      },
      payment,
      items: lines,
      subtotal,
      shippingCost,
      couponCode: null,
      couponDiscount: 0,
      pixDiscount,
      total: Math.round((subtotal + shippingCost - pixDiscount) * 100) / 100,
    };
  });
}

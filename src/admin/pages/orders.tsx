import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/data/catalog";
import { Card, EmptyState, PageHeader, StatusBadge, Tabs } from "@/admin/ui";
import { SearchIcon } from "@/components/icons";
import { useOrders } from "@/lib/db";
import { STATUS_TONE } from "@/admin/tones";
import { brl } from "@/lib/format";
import { useTitle } from "@/lib/title";

type Filter = "todos" | OrderStatus;

export function OrdersPage() {
  useTitle("Pedidos");
  const orders = useOrders();
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as Filter | null) ?? "todos";
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: orders.length };
    for (const s of ORDER_STATUSES) c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  const list = orders.filter((o) => {
    if (status !== "todos" && o.status !== status) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      o.number.toLowerCase().includes(term) ||
      o.customer.nome.toLowerCase().includes(term) ||
      o.customer.email.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${orders.length} pedidos no total`} />

      <div className="mb-4 flex flex-col gap-3">
        <Tabs<Filter>
          label="Filtrar por situação"
          value={status}
          onChange={(v) => setParams(v === "todos" ? {} : { status: v }, { replace: true })}
          items={[
            { value: "todos", label: "Todos", count: counts.todos },
            ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], count: counts[s], tone: STATUS_TONE[s] })),
          ]}
        />
        <label className="relative block max-w-sm">
          <span className="sr-only">Buscar pedido</span>
          <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número, nome ou e-mail"
            className="h-11 w-full rounded-full border border-line bg-white pr-4 pl-10 text-[15px] outline-none focus:border-copper"
          />
        </label>
      </div>

      <Card bodyClassName="">
        {list.length ? (
          <>
            <div className="hidden grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)_90px_110px_170px] gap-3 border-b border-line px-5 py-2.5 text-[12px] font-medium text-muted md:grid">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Entrega</span>
              <span>Pagamento</span>
              <span className="text-right">Total</span>
              <span>Situação</span>
            </div>
            <ul className="divide-y divide-line">
              {list.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/admin/pedidos/${o.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-4 py-3 hover:bg-alabaster md:grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)_90px_110px_170px] md:items-center md:px-5"
                  >
                    <span className="flex flex-col">
                      <span className="text-[14px] font-semibold">#{o.number}</span>
                      <span className="text-[12px] text-muted">
                        {new Date(o.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </span>
                    <span className="text-right text-[14px] font-bold md:hidden">{brl(o.total)}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px]">{o.customer.nome}</span>
                      <span className="truncate text-[12px] text-muted">
                        {o.items.reduce((n, i) => n + i.qty, 0)} peça(s)
                      </span>
                    </span>
                    <span className="hidden truncate text-[13px] text-body-2 md:block">{o.delivery.methodName}</span>
                    <span className="hidden text-[13px] text-body-2 md:block">{o.payment === "pix" ? "Pix" : "Cartão"}</span>
                    <span className="hidden text-right text-[14px] font-bold md:block">{brl(o.total)}</span>
                    <span className="justify-self-end md:justify-self-start">
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState title="Nenhum pedido encontrado">
            {q ? "Tente outro termo de busca." : "Os pedidos feitos na loja aparecem aqui."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}

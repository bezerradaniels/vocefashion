import { useLayoutEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link } from "react-router";
import { SIZES, type Order } from "@/data/catalog";
import { Badge, Card, EmptyState, PageHeader, StatusBadge, Tabs } from "@/admin/ui";
import { DOT, TONE, type Tone } from "@/admin/tones";
import { ArrowUpIcon, CardIcon, ReceiptIcon, TicketIcon } from "@/components/icons";
import { cx } from "@/lib/cx";
import { useOrders, useProducts } from "@/lib/db";
import { brl } from "@/lib/format";
import { useTitle } from "@/lib/title";

/** Pedidos que contam como venda (pagos em diante). */
const PAID = new Set<Order["status"]>(["pago", "em_separacao", "enviado", "entregue"]);

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shortDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export function DashboardPage() {
  useTitle("Painel");
  const orders = useOrders();
  const products = useProducts();
  const [range, setRange] = useState<"7" | "30">("7");
  const days = Number(range);
  // "Hoje" fixado ao abrir a página (render puro).
  const [now] = useState(() => Date.now());

  const data = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const inRange = orders.filter((o) => new Date(o.createdAt) >= start);
    const paid = inRange.filter((o) => PAID.has(o.status));
    const waiting = inRange.filter((o) => o.status === "aguardando_pagamento");
    const revenue = paid.reduce((n, o) => n + o.total, 0);

    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayKey(d);
      const value = paid
        .filter((o) => dayKey(new Date(o.createdAt)) === key)
        .reduce((n, o) => n + o.total, 0);
      return { date: d, value };
    });

    const sold = new Map<number, { name: string; qty: number }>();
    for (const o of paid)
      for (const it of o.items) {
        const cur = sold.get(it.pid) ?? { name: it.name, qty: 0 };
        cur.qty += it.qty;
        sold.set(it.pid, cur);
      }
    const top = [...sold.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

    return {
      revenue,
      paidCount: paid.length,
      ticket: paid.length ? revenue / paid.length : 0,
      waitingCount: waiting.length,
      waitingValue: waiting.reduce((n, o) => n + o.total, 0),
      series,
      top,
    };
  }, [orders, days, now]);

  const lowStock = products
    .filter((p) => p.active)
    .flatMap((p) => SIZES.filter((s) => p.stock[s] <= 1).map((s) => ({ p, size: s, qty: p.stock[s] })))
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 8);

  const recent = orders.slice(0, 6);

  return (
    <>
      <PageHeader title="Início" subtitle="Resumo das vendas da loja." />

      {/* Filtro de período: uma linha, acima de tudo o que ele afeta. */}
      <div className="mb-4">
        <Tabs
          label="Período"
          value={range}
          onChange={setRange}
          items={[
            { value: "7", label: "Últimos 7 dias" },
            { value: "30", label: "Últimos 30 dias" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tone="ok" icon={ArrowUpIcon} label="Faturamento" value={brl(data.revenue)} caption="Pedidos pagos no período" />
        <StatTile tone="info" icon={ReceiptIcon} label="Pedidos pagos" value={String(data.paidCount)} caption="Sem contar cancelados" />
        <StatTile tone="violet" icon={TicketIcon} label="Ticket médio" value={brl(data.ticket)} caption="Faturamento ÷ pedidos" />
        <StatTile
          tone="warn"
          icon={CardIcon}
          label="Aguardando pagamento"
          value={String(data.waitingCount)}
          caption={data.waitingCount ? `${brl(data.waitingValue)} a receber` : "Nenhum pendente"}
          to={data.waitingCount ? "/admin/pedidos?status=aguardando_pagamento" : undefined}
        />
      </div>

      <Card
        title="Vendas por dia"
        description="Faturamento dos pedidos pagos (sem cancelados)."
        className="mt-4"
      >
        <SalesChart series={data.series} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          title="Pedidos recentes"
          actions={
            <Link to="/admin/pedidos" className="text-[13px] font-semibold underline underline-offset-[3px]">
              Ver todos
            </Link>
          }
          bodyClassName=""
        >
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/admin/pedidos/${o.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-alabaster sm:px-5"
                  >
                    <span className="truncate text-[14px] font-semibold">
                      #{o.number} · {o.customer.nome}
                    </span>
                    <span className="text-right text-[14px] font-bold">{brl(o.total)}</span>
                    <span className="text-[12px] text-muted">
                      {new Date(o.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span className="justify-self-end">
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhum pedido ainda" />
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Estoque baixo" description="Tamanhos com 1 peça ou esgotados." bodyClassName="">
            {lowStock.length ? (
              <ul className="divide-y divide-line">
                {lowStock.map(({ p, size, qty }) => (
                  <li key={`${p.id}-${size}`}>
                    <Link
                      to={`/admin/produtos/${p.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-alabaster sm:px-5"
                    >
                      <span className="min-w-0 truncate text-[14px]">
                        {p.name} <span className="text-muted">· {size}</span>
                      </span>
                      {qty === 0 ? <Badge tone="danger">Esgotado</Badge> : <Badge tone="warn">Última peça</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Estoque em dia" />
            )}
          </Card>

          <Card title="Mais vendidos" description="Peças em pedidos pagos no período." bodyClassName="">
            {data.top.length ? (
              <ol className="divide-y divide-line">
                {data.top.map(([pid, t], i) => (
                  <li key={pid} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <span className="min-w-0 truncate text-[14px]">
                      <span className="mr-2 text-muted">{i + 1}.</span>
                      {t.name}
                    </span>
                    <span className="text-[14px] font-semibold">
                      {t.qty} {t.qty === 1 ? "peça" : "peças"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="Sem vendas no período" />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

/** Indicador: ícone num círculo colorido e faixa da mesma cor no topo. */
function StatTile({
  label,
  value,
  caption,
  to,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption: string;
  to?: string;
  tone: Tone;
  icon: ComponentType<{ size?: number }>;
}) {
  const body = (
    <>
      <span aria-hidden="true" className={cx("absolute inset-x-0 top-0 h-1", DOT[tone])} />
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-body-2">{label}</span>
        <span aria-hidden="true" className={cx("flex size-8 flex-none items-center justify-center rounded-full", TONE[tone])}>
          <Icon size={17} />
        </span>
      </span>
      <span className="text-[22px] leading-7 font-semibold tracking-[-.01em] sm:text-[26px] sm:leading-8">{value}</span>
      <span className="text-[12px] text-muted">{caption}</span>
    </>
  );
  const cls = "relative flex flex-col gap-1 overflow-hidden rounded-card border border-line bg-white p-4";
  return to ? (
    <Link to={to} className={`${cls} hover:border-charcoal`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* Gráfico de colunas: uma série (cobre), sem legenda (o título nomeia).
   Colunas ≤ 24px, topo arredondado 4px e base reta, grade em linha fina,
   tooltip no hover e no foco do teclado, e tabela para quem não enxerga o gráfico. */
function SalesChart({ series }: { series: { date: Date; value: number }[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 200;
  const pad = { top: 12, right: 8, bottom: 26, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const max = Math.max(...series.map((s) => s.value), 0);
  const step = niceStep(max / 3);
  const top = Math.max(step * 3, step);
  const ticks = [0, step, step * 2, step * 3].filter((t) => t <= top);
  const slot = plotW / series.length;
  const barW = Math.min(24, Math.max(4, slot - 6));
  const labelEvery = series.length > 10 ? Math.ceil(series.length / 6) : 1;
  const y = (v: number) => pad.top + plotH - (v / top) * plotH;
  const total = series.reduce((n, s) => n + s.value, 0);

  return (
    <div className="flex flex-col gap-3">
      <div ref={wrapRef} className="relative" onPointerLeave={() => setHover(null)}>
        {total === 0 && (
          <p className="absolute inset-x-0 top-16 text-center text-[14px] text-muted">Sem vendas pagas no período.</p>
        )}
        <svg width={width} height={H} role="img" aria-label="Vendas por dia no período selecionado" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#EDEBE8" strokeWidth={1} />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">
                {compactBRL(t)}
              </text>
            </g>
          ))}
          {series.map((s, i) => {
            const cx = pad.left + slot * i + slot / 2;
            const h = (s.value / top) * plotH;
            return (
              <g key={i}>
                {/* Área de toque maior que a coluna. */}
                <rect
                  x={pad.left + slot * i}
                  y={pad.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${shortDate(s.date)}: ${brl(s.value)}`}
                  onPointerMove={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
                {h > 0 && (
                  <path
                    d={columnPath(cx - barW / 2, y(s.value), barW, h)}
                    fill={hover === i ? "#A6654A" : "#B87353"}
                    pointerEvents="none"
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
                    {shortDate(s.date)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="#D5D3D0" strokeWidth={1} />
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-field bg-charcoal px-3 py-2 text-white"
            style={{
              left: Math.min(Math.max(pad.left + slot * hover + slot / 2, 60), width - 60),
              top: Math.max(0, y(series[hover].value) - 58),
            }}
          >
            <div className="text-[14px] font-semibold">{brl(series[hover].value)}</div>
            <div className="text-[12px] text-white/75">
              {series[hover].date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
            </div>
          </div>
        )}
      </div>

      <details className="text-[13px]">
        <summary className="cursor-pointer font-medium text-body-2">Ver em tabela</summary>
        <table className="mt-2 w-full max-w-sm text-left">
          <thead>
            <tr className="text-muted">
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1">{shortDate(s.date)}</td>
                <td className="py-1 text-right">{brl(s.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Coluna com topo arredondado (4px) e base reta na linha de base. */
function columnPath(x: number, yTop: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  const base = yTop + h;
  return `M${x},${base}V${yTop + r}Q${x},${yTop} ${x + r},${yTop}H${x + w - r}Q${x + w},${yTop} ${x + w},${yTop + r}V${base}Z`;
}

function niceStep(raw: number) {
  if (raw <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

function compactBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

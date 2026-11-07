import { Link, useParams } from "react-router";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/data/catalog";
import { Card, EmptyState, PageHeader, Select, StatusBadge } from "@/admin/ui";
import { useFlash } from "@/admin/use-flash";
import { WhatsAppIcon } from "@/components/icons";
import { dbActions, useOrders } from "@/lib/db";
import { brl, whatsappUrl } from "@/lib/format";
import { useTitle } from "@/lib/title";

export function OrderDetailPage() {
  const { id } = useParams();
  const order = useOrders().find((o) => o.id === id);
  useTitle(order ? `Pedido #${order.number}` : "Pedido não encontrado");
  const { flash, node } = useFlash();

  if (!order) {
    return (
      <>
        <PageHeader title="Pedido não encontrado" back={{ to: "/admin/pedidos", label: "Pedidos" }} />
        <Card>
          <EmptyState title="Este pedido não existe ou foi removido." />
        </Card>
      </>
    );
  }

  function changeStatus(status: OrderStatus) {
    if (!order || status === order.status) return;
    if (status === "cancelado" && !window.confirm("Cancelar este pedido? As peças voltam para o estoque.")) return;
    dbActions.setOrderStatus(order.id, status);
    flash(`Situação alterada para "${ORDER_STATUS_LABEL[status]}"`);
  }

  const d = order.delivery;
  const firstName = order.customer.nome.split(" ")[0];
  const message = `Oi, ${firstName}! Aqui é da Você Fashion, sobre o seu pedido #${order.number}.`;

  return (
    <>
      <PageHeader
        back={{ to: "/admin/pedidos", label: "Pedidos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Pedido #{order.number} <StatusBadge status={order.status} />
          </span>
        }
        subtitle={new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card title="Itens" bodyClassName="">
            <ul className="divide-y divide-line">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <span className="flex min-w-0 flex-col">
                    <Link to={`/admin/produtos/${it.pid}`} className="truncate text-[14px] font-semibold hover:underline">
                      {it.name}
                    </Link>
                    <span className="text-[12px] text-muted">
                      Tamanho {it.size} · {it.qty} × {brl(it.price)}
                    </span>
                  </span>
                  <span className="text-[14px] font-bold">{brl(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-1.5 border-t border-line px-4 py-3.5 text-[14px] sm:px-5">
              <Row label="Subtotal" value={brl(order.subtotal)} />
              <Row label="Frete" value={order.shippingCost ? brl(order.shippingCost) : "Grátis"} />
              {order.couponDiscount > 0 && (
                <Row label={`Cupom ${order.couponCode ?? ""}`} value={`− ${brl(order.couponDiscount)}`} />
              )}
              {order.pixDiscount > 0 && <Row label="Desconto Pix" value={`− ${brl(order.pixDiscount)}`} />}
              <div className="mt-1 flex justify-between border-t border-line pt-2.5 text-[16px] font-bold">
                <dt>Total</dt>
                <dd>{brl(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Entrega">
            <dl className="flex flex-col gap-1.5 text-[14px]">
              <Row label="Forma" value={d.methodName} />
              {d.pickup ? (
                <p className="text-body-2">A cliente vai retirar na loja.</p>
              ) : (
                <>
                  <Row label="Endereço" value={`${d.rua}, ${d.num}${d.comp ? ` · ${d.comp}` : ""}`} />
                  <Row label="Bairro" value={d.bairro} />
                </>
              )}
              <Row label="CEP" value={d.cep} />
              {d.city && <Row label="Cidade" value={d.city} />}
            </dl>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Situação do pedido">
            <div className="flex flex-col gap-3">
              <Select
                label="Alterar situação"
                value={order.status}
                onChange={(e) => changeStatus(e.target.value as OrderStatus)}
                hint="Cancelar devolve as peças ao estoque."
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card title="Cliente">
            <dl className="flex flex-col gap-1.5 text-[14px]">
              <Row label="Nome" value={order.customer.nome} />
              <Row label="E-mail" value={order.customer.email} />
              <Row label="Celular" value={order.customer.cel} />
              <Row label="CPF" value={order.customer.cpf} />
            </dl>
            <a
              href={whatsappUrl(order.customer.cel, message)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-charcoal text-[15px] font-semibold hover:bg-charcoal hover:text-white"
            >
              <WhatsAppIcon size={20} />
              Chamar no WhatsApp
            </a>
          </Card>

          <Card title="Pagamento">
            <dl className="flex flex-col gap-1.5 text-[14px]">
              <Row label="Forma" value={order.payment === "pix" ? "Pix" : "Cartão de crédito"} />
              {order.couponCode && <Row label="Cupom" value={order.couponCode} />}
            </dl>
          </Card>
        </div>
      </div>
      {node}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-body-2">{label}</dt>
      <dd className="text-right break-all">{value}</dd>
    </div>
  );
}

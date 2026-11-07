import { useNavigate } from "react-router";
import { useState, type ReactNode } from "react";
import { applyCoupon, shippingOptions } from "@/data/catalog";
import { FloatingField } from "@/components/field";
import {
  BackIcon,
  CardIcon,
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
  PixIcon,
} from "@/components/icons";
import { cx } from "@/lib/cx";
import {
  IconButton,
  PrimaryButton,
  ProductPhoto,
  QtyStepper,
  SecondaryButton,
} from "@/components/ui";
import { dbActions, useCoupons, useSettings } from "@/lib/db";
import { brl, digits, isValidCpf, MASKS, type MaskName } from "@/lib/format";
import { useGoBack } from "@/lib/navigation";
import { actions, useBagLines } from "@/lib/store";

type FieldKey =
  | "nome"
  | "email"
  | "cel"
  | "cpf"
  | "cep"
  | "rua"
  | "num"
  | "bairro"
  | "comp"
  | "cartao"
  | "titular"
  | "validade"
  | "cvv"
  | "cupom";
type Errors = Partial<Record<FieldKey, string>>;
type Step = 1 | 2 | 3;
type Pay = "pix" | "card";

const MASK_FOR: Partial<Record<FieldKey, MaskName>> = {
  cel: "cel",
  cpf: "cpf",
  cep: "cep",
  cartao: "card",
  validade: "expiry",
  cvv: "cvv",
};

export function Checkout() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const settings = useSettings();
  const coupons = useCoupons();
  const { lines, count: bagCount, subtotal } = useBagLines();
  const { pix, card } = settings.payments;
  const PIX_PCT = pix.discountPercent;
  const INSTALLMENTS = Math.max(1, card.installments);

  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [open, setOpen] = useState<0 | Step>(1);
  const [done, setDone] = useState<Partial<Record<Step, boolean>>>({});
  const [cepDone, setCepDone] = useState(false);
  const [cepLocal, setCepLocal] = useState(false);
  const [ship, setShip] = useState<string | null>(null);
  const [payChoice, setPay] = useState<Pay>(pix.enabled ? "pix" : "card");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [success, setSuccess] = useState<{ pay: Pay; total: number; order: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Forma de pagamento desativada no admin não pode ficar selecionada.
  const pay: Pay =
    payChoice === "pix" && !pix.enabled ? "card" : payChoice === "card" && !card.enabled ? "pix" : payChoice;
  const noPayment = !pix.enabled && !card.enabled;

  // ---- Valores ----
  const opts = shippingOptions(settings, cepLocal, subtotal);
  const shipSel = opts.find((o) => o.id === ship);
  const frete = cepDone && shipSel ? shipSel.finalPrice : null;
  const couponResult = couponCode ? applyCoupon(coupons, couponCode, subtotal) : null;
  const couponDiscount = couponResult?.ok ? couponResult.discount : 0;
  const base = subtotal - couponDiscount;
  const pixDisc = pay === "pix" ? Math.round(base * PIX_PCT) / 100 : 0;
  const total = base + (frete ?? 0) - pixDisc;
  const installment = (base + (frete ?? 0)) / INSTALLMENTS;

  // ---- Campos ----
  const v = (k: FieldKey) => values[k] ?? "";

  function setVal(key: FieldKey, raw: string) {
    const mask = MASK_FOR[key];
    const value = mask ? MASKS[mask](raw) : raw;
    setValues((s) => ({ ...s, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    // Mudar o CEP depois de calcular invalida o frete e a etapa 2.
    if (key === "cep" && cepDone) {
      setCepDone(false);
      setShip(null);
      setDone((d) => ({ ...d, 2: false }));
    }
  }

  const field = (key: FieldKey) => ({
    name: key,
    value: v(key),
    error: errors[key],
    onChange: (raw: string) => setVal(key, raw),
  });

  // ---- Validação ----
  function validate(n: Step): Errors {
    const e: Errors = {};
    if (n === 1) {
      if (!/\S+\s+\S+/.test(v("nome"))) e.nome = "Informe nome e sobrenome";
      if (!/^\S+@\S+\.\S{2,}$/.test(v("email"))) e.email = "Confira seu e-mail";
      if (digits(v("cel")).length < 11) e.cel = "Celular com DDD";
      if (digits(v("cpf")).length !== 11) e.cpf = "CPF incompleto";
      else if (!isValidCpf(v("cpf"))) e.cpf = "CPF inválido";
    }
    if (n === 2) {
      if (!cepDone || !shipSel) e.cep = "Calcule o frete pelo CEP";
      else if (!shipSel.pickup) {
        if (!v("rua").trim()) e.rua = "Informe a rua";
        if (!v("num").trim()) e.num = "Informe o nº";
        if (!v("bairro").trim()) e.bairro = "Informe o bairro";
      }
    }
    if (n === 3 && pay === "card") {
      if (digits(v("cartao")).length < 16) e.cartao = "Número incompleto";
      if (!v("titular").trim()) e.titular = "Como está no cartão";
      if (digits(v("validade")).length !== 4) e.validade = "MM/AA";
      if (digits(v("cvv")).length < 3) e.cvv = "3 dígitos";
    }
    return e;
  }

  function next(n: Step) {
    const e = validate(n);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setDone((d) => ({ ...d, [n]: true }));
    setOpen(n < 3 ? ((n + 1) as Step) : 0);
  }

  function toggleStep(n: Step) {
    if (n > 1 && !done[(n - 1) as Step]) return;
    setOpen(open === n ? 0 : n);
    setErrors({});
  }

  function calcCep() {
    const d = digits(v("cep"));
    if (d.length !== 8) {
      setErrors((e) => ({ ...e, cep: "CEP com 8 dígitos" }));
      return;
    }
    // TODO produção: ViaCEP para o endereço + API de frete (Melhor Envio/Correios).
    const local = d.startsWith(settings.shipping.localCepPrefix);
    const available = shippingOptions(settings, local, subtotal);
    if (!available.length) {
      setErrors((e) => ({ ...e, cep: "Ainda não entregamos neste CEP" }));
      return;
    }
    setCepDone(true);
    setCepLocal(local);
    setShip((available.find((o) => !o.pickup) ?? available[0]).id);
  }

  function applyCouponCode() {
    const code = v("cupom").trim();
    if (!code) {
      setErrors((e) => ({ ...e, cupom: "Digite o código do cupom" }));
      return;
    }
    const r = applyCoupon(coupons, code, subtotal);
    if (!r.ok) {
      setErrors((e) => ({ ...e, cupom: r.error }));
      return;
    }
    setCouponCode(r.coupon.code);
    setValues((s) => ({ ...s, cupom: "" }));
  }

  function finish() {
    if (!lines.length || noPayment) return;
    for (const n of [1, 2, 3] as const) {
      const e = validate(n);
      if (Object.keys(e).length) {
        setOpen(n);
        setErrors(e);
        return;
      }
    }
    if (!shipSel) return;
    // TODO produção: criar o pedido no backend e gerar a cobrança (Pix/cartão) no gateway.
    const order = dbActions.createOrder({
      customer: { nome: v("nome").trim(), email: v("email").trim(), cel: v("cel"), cpf: v("cpf") },
      delivery: {
        methodId: shipSel.id,
        methodName: shipSel.name,
        pickup: shipSel.pickup,
        cep: v("cep"),
        city: cepLocal ? settings.shipping.localCityLabel : "",
        rua: shipSel.pickup ? "" : v("rua").trim(),
        num: shipSel.pickup ? "" : v("num").trim(),
        bairro: shipSel.pickup ? "" : v("bairro").trim(),
        comp: shipSel.pickup ? "" : v("comp").trim(),
      },
      payment: pay,
      items: lines.map((l) => ({
        pid: l.pid,
        name: l.product.name,
        size: l.size,
        qty: l.qty,
        price: l.product.price,
      })),
      subtotal,
      shippingCost: frete ?? 0,
      couponCode: couponResult?.ok ? couponResult.coupon.code : null,
      couponDiscount,
      pixDiscount: pixDisc,
      total: Math.round(total * 100) / 100,
    });
    setDone({ 1: true, 2: true, 3: true });
    setOpen(0);
    setSuccess({ pay, total, order: order.number });
    actions.clearBag();
  }

  const stepState = (n: Step) => ({
    isOpen: open === n,
    isDone: !!done[n],
    locked: n > 1 && !done[(n - 1) as Step],
  });

  const s1Summary = [v("nome"), v("email")].filter(Boolean).join(" · ");
  const s2Summary = shipSel
    ? `${shipSel.name} · ${shipSel.finalPrice ? brl(shipSel.finalPrice) : "Grátis"}`
    : "";
  const s3Summary =
    pay === "pix"
      ? PIX_PCT
        ? `Pix · ${PIX_PCT}% de desconto`
        : "Pix"
      : `Cartão · ${INSTALLMENTS}x de ${brl(total / INSTALLMENTS)}`;

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-alabaster">
      <header className="sticky top-0 z-[5] grid h-14 grid-cols-[48px_1fr_auto] items-center border-b border-line bg-white pr-3 pl-1">
        <IconButton aria-label="Voltar" onClick={goBack}>
          <BackIcon size={22} />
        </IconButton>
        <h1 className="font-display text-[19px] font-semibold">Finalizar pedido</h1>
        <span className="flex items-center gap-[5px] text-[12px] font-medium text-body-2">
          <LockIcon size={16} />
          Compra segura
        </span>
      </header>

      <main className="flex flex-col gap-2 px-3 pt-3 pb-[calc(150px+env(safe-area-inset-bottom))]">
        {/* Sacola */}
        <section className="rounded-card border border-line bg-white">
          <button
            type="button"
            aria-expanded={summaryOpen}
            onClick={() => setSummaryOpen((o) => !o)}
            className="flex min-h-[52px] w-full items-center justify-between px-4 text-charcoal"
          >
            <span className="text-[14px] font-semibold">
              Sua sacola · {bagCount} {bagCount === 1 ? "item" : "itens"}
            </span>
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              {brl(subtotal)}
              <ChevronDownIcon
                size={18}
                className={cx("transition-transform duration-200", summaryOpen && "rotate-180")}
              />
            </span>
          </button>
          {summaryOpen && (
            <div className="border-t border-line px-4 py-1">
              {lines.map((l) => (
                <div
                  key={`${l.pid}-${l.size}`}
                  className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 py-2.5"
                >
                  <ProductPhoto
                    src={l.product.images[0]}
                    alt={l.product.name}
                    stripe={5}
                    className="h-[65px] w-[52px] rounded-thumb"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-display text-[15px] leading-[19px] font-semibold">
                      {l.product.name}
                    </span>
                    <span className="text-[12px] text-muted">Tamanho {l.size}</span>
                    <span className="mt-0.5 text-[14px] font-bold">{brl(l.product.price * l.qty)}</span>
                  </div>
                  <QtyStepper
                    qty={l.qty}
                    label={l.product.name}
                    onDec={() => actions.changeQty(l.index, -1)}
                    onInc={() => actions.changeQty(l.index, 1)}
                  />
                </div>
              ))}
              {!lines.length && (
                <p className="py-4 text-[14px] text-muted">
                  Sua sacola está vazia. Adicione peças na tela de produto.
                </p>
              )}
            </div>
          )}
        </section>

        {/* 1. Identificação */}
        <StepCard n={1} title="Identificação" {...stepState(1)} summary={s1Summary} onToggle={() => toggleStep(1)}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <FloatingField label="Nome completo" placeholder="Maria da Silva" autoComplete="name" {...field("nome")} />
              <FloatingField label="E-mail" type="email" placeholder="voce@email.com" autoComplete="email" {...field("email")} />
              <FloatingField
                label="Celular (WhatsApp)"
                type="tel"
                placeholder="(77) 99999-0000"
                autoComplete="tel-national"
                span={1}
                {...field("cel")}
              />
              <FloatingField
                label="CPF"
                type="tel"
                inputMode="numeric"
                placeholder="000.000.000-00"
                autoComplete="off"
                span={1}
                {...field("cpf")}
              />
            </div>
            <SecondaryButton type="button" onClick={() => next(1)}>
              Continuar para entrega
            </SecondaryButton>
          </div>
        </StepCard>

        {/* 2. Entrega */}
        <StepCard n={2} title="Entrega" {...stepState(2)} summary={s2Summary} onToggle={() => toggleStep(2)}>
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <FloatingField
                label="CEP"
                type="tel"
                inputMode="numeric"
                placeholder="47600-000"
                autoComplete="postal-code"
                span="auto"
                {...field("cep")}
              />
              <button
                type="button"
                onClick={calcCep}
                className="h-14 rounded-full bg-charcoal px-[18px] text-[15px] font-semibold text-white"
              >
                Calcular
              </button>
            </div>
            {!cepDone && (
              <span className="-mt-1.5 text-[13px] leading-[1.45] text-muted">
                Em {settings.shipping.localCityLabel.split(" — ")[0]}? Seu CEP mostra as opções de retirada e entrega local.
              </span>
            )}
            {cepDone && (
              <>
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opções de frete">
                  <span className="text-[13px] font-medium text-body-2">
                    {cepLocal ? settings.shipping.localCityLabel : "Envio para todo o Brasil"}
                  </span>
                  {opts.map((o) => (
                    <RadioCard
                      key={o.id}
                      selected={o.id === ship}
                      onSelect={() => setShip(o.id)}
                      className="min-h-16 grid-cols-[20px_minmax(0,1fr)_auto] px-3.5 py-2.5"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-semibold">{o.name}</span>
                        <span className="text-[12px] leading-4 text-muted">{o.note}</span>
                      </span>
                      <span className={cx("text-[14px] font-bold", o.finalPrice ? "text-charcoal" : "text-copper")}>
                        {o.finalPrice ? brl(o.finalPrice) : "Grátis"}
                      </span>
                    </RadioCard>
                  ))}
                </div>
                {shipSel && !shipSel.pickup && (
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingField label="Rua / Avenida" autoComplete="address-line1" {...field("rua")} />
                    <FloatingField label="Número" autoComplete="off" span={1} {...field("num")} />
                    <FloatingField label="Bairro" autoComplete="address-level3" span={1} {...field("bairro")} />
                    <FloatingField label="Complemento (opcional)" autoComplete="address-line2" {...field("comp")} />
                  </div>
                )}
                <SecondaryButton type="button" onClick={() => next(2)}>
                  Continuar para pagamento
                </SecondaryButton>
              </>
            )}
          </div>
        </StepCard>

        {/* 3. Pagamento */}
        <StepCard n={3} title="Pagamento" {...stepState(3)} summary={s3Summary} onToggle={() => toggleStep(3)}>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Forma de pagamento">
              {pix.enabled && (
              <RadioCard
                selected={pay === "pix"}
                onSelect={() => {
                  setPay("pix");
                  setErrors({});
                }}
                className="min-h-[76px] grid-cols-[20px_28px_minmax(0,1fr)] px-3.5 py-3"
              >
                <PixIcon size={26} className="text-copper" />
                <span className="flex flex-col gap-[3px]">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold">Pix</span>
                    <span className="rounded-full bg-copper px-1.5 py-1 text-[10px] leading-none font-semibold tracking-[.06em] text-white uppercase">
                      Recomendado
                    </span>
                  </span>
                  <span className="text-[13px] leading-[18px] text-body-2">
                    {PIX_PCT ? `${PIX_PCT}% de desconto · aprovação na hora` : "Aprovação na hora"}
                  </span>
                </span>
              </RadioCard>
              )}
              {card.enabled && (
              <RadioCard
                selected={pay === "card"}
                onSelect={() => setPay("card")}
                className="min-h-[68px] grid-cols-[20px_28px_minmax(0,1fr)] px-3.5 py-3"
              >
                <CardIcon size={26} />
                <span className="flex flex-col gap-[3px]">
                  <span className="text-[15px] font-semibold">Cartão de crédito</span>
                  <span className="text-[13px] leading-[18px] text-body-2">
                    {INSTALLMENTS > 1 ? `Até ${INSTALLMENTS}x de ${brl(installment)} sem juros` : "À vista"}
                  </span>
                </span>
              </RadioCard>
              )}
              {noPayment && (
                <p className="text-[14px] text-error">Pagamento online indisponível no momento. Fale com a loja.</p>
              )}
            </div>
            {pay === "card" && (
              <div className="mt-1 grid grid-cols-2 gap-3">
                <FloatingField
                  label="Número do cartão"
                  type="tel"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  autoComplete="cc-number"
                  {...field("cartao")}
                />
                <FloatingField label="Nome impresso no cartão" autoComplete="cc-name" {...field("titular")} />
                <FloatingField
                  label="Validade"
                  type="tel"
                  inputMode="numeric"
                  placeholder="MM/AA"
                  autoComplete="cc-exp"
                  span={1}
                  {...field("validade")}
                />
                <FloatingField
                  label="CVV"
                  type="tel"
                  inputMode="numeric"
                  placeholder="123"
                  autoComplete="cc-csc"
                  span={1}
                  {...field("cvv")}
                />
              </div>
            )}
            <div className="flex items-center gap-2 pt-1.5 text-[12px] leading-4 text-body-2">
              <LockIcon size={16} className="flex-none" />
              Pagamento criptografado. Não guardamos os dados do seu cartão.
            </div>
          </div>
        </StepCard>

        {/* Valores */}
        <section className="flex flex-col gap-2 rounded-card border border-line bg-white px-4 py-3.5 text-[14px]">
          {couponResult?.ok ? (
            <div className="mb-1 flex items-center justify-between gap-3 rounded-field bg-copper-tint px-3 py-2.5">
              <span className="text-[13px]">
                Cupom <strong className="font-semibold">{couponResult.coupon.code}</strong> aplicado
              </span>
              <button
                type="button"
                onClick={() => setCouponCode(null)}
                className="text-[13px] font-medium underline underline-offset-[3px]"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="mb-1 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <FloatingField
                label="Cupom de desconto"
                autoComplete="off"
                span="auto"
                {...field("cupom")}
                error={errors.cupom ?? (couponResult && !couponResult.ok ? couponResult.error : undefined)}
                onChange={(raw) => setVal("cupom", raw.toUpperCase())}
              />
              <button
                type="button"
                onClick={applyCouponCode}
                className="h-14 rounded-full bg-charcoal px-[18px] text-[15px] font-semibold text-white"
              >
                Aplicar
              </button>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-body-2">Subtotal</span>
            <span>{brl(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-2">Frete</span>
            <span>{frete === null ? "Informe o CEP" : frete ? brl(frete) : "Grátis"}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between font-medium text-copper">
              <span>Cupom {couponResult?.ok ? couponResult.coupon.code : ""}</span>
              <span>− {brl(couponDiscount)}</span>
            </div>
          )}
          {pixDisc > 0 && (
            <div className="flex justify-between font-medium text-copper">
              <span>Desconto Pix ({PIX_PCT}%)</span>
              <span>− {brl(pixDisc)}</span>
            </div>
          )}
        </section>
      </main>

      {/* Total fixo */}
      <div className="pb-safe-bar fixed inset-x-0 bottom-0 z-[9] mx-auto grid max-w-[480px] grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-t border-line bg-white px-4 pt-3">
        <div className="flex flex-col gap-px">
          <span className="text-[12px] text-muted">Total</span>
          <span className="text-[21px] font-bold">{brl(total)}</span>
          <span className="text-[11px] font-medium text-copper">
            {pixDisc + couponDiscount > 0
              ? `Economia de ${brl(pixDisc + couponDiscount)}`
              : pay === "card" && INSTALLMENTS > 1
                ? `em até ${INSTALLMENTS}x sem juros`
                : ""}
          </span>
        </div>
        <PrimaryButton type="button" onClick={finish} disabled={!lines.length || noPayment}>
          Finalizar Compra
        </PrimaryButton>
      </div>

      {/* Sucesso */}
      {success && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
          className="fixed inset-0 z-20 mx-auto flex max-w-[480px] flex-col items-center gap-[18px] overflow-y-auto bg-white px-7 pt-24 pb-[calc(40px+env(safe-area-inset-bottom))] text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-copper text-white">
            <CheckIcon size={28} />
          </span>
          <h2 id="success-title" className="font-display text-[30px] leading-9 font-bold tracking-[-.02em]">
            {success.pay === "pix" ? "Quase lá!" : "Pedido confirmado!"}
          </h2>
          <p className="text-[15px] leading-[22px] text-pretty text-body-2">
            {success.pay === "pix"
              ? `Pague ${brl(success.total)} com o Pix para confirmar seu pedido #${success.order}. Enviamos os detalhes no seu WhatsApp.`
              : `Pagamento aprovado. Pedido #${success.order} — acompanhe tudo pelo WhatsApp.`}
          </p>
          {success.pay === "pix" && (
            <>
              {/* TODO produção: QR Code e código copia-e-cola vindos do gateway de pagamento. */}
              <div
                className="flex size-[184px] items-center justify-center rounded-card border border-line"
                style={{ background: "repeating-linear-gradient(135deg,#F3F3F3 0 6px,#EAEAEA 6px 12px)" }}
              >
                <span className="font-mono text-[10px] tracking-[.08em] text-muted uppercase">QR Code Pix</span>
              </div>
              <PrimaryButton type="button" className="h-[52px]" onClick={() => setCopied(true)}>
                {copied ? "Código copiado ✓" : "Copiar código Pix"}
              </PrimaryButton>
              <span className="text-[13px] text-muted">O código expira em 30 minutos.</span>
            </>
          )}
          <SecondaryButton type="button" className="mt-auto" onClick={() => navigate("/")}>
            Voltar para a loja
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}

function StepCard({
  n,
  title,
  isOpen,
  isDone,
  locked,
  summary,
  onToggle,
  children,
}: {
  n: Step;
  title: string;
  isOpen: boolean;
  isDone: boolean;
  locked: boolean;
  summary: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  const showSummary = isDone && !isOpen;
  const panelId = `step-${n}`;
  return (
    <section className={cx("rounded-card border bg-white", isOpen ? "border-charcoal" : "border-line")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-disabled={locked}
        className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left text-charcoal aria-disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          className={cx(
            "box-border flex size-[26px] flex-none items-center justify-center rounded-full border text-[12px] font-semibold",
            showSummary
              ? "border-copper bg-copper text-white"
              : isOpen
                ? "border-charcoal bg-charcoal text-white"
                : "border-line bg-white text-muted",
          )}
        >
          {showSummary ? "✓" : n}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cx(
              "font-display text-[18px] leading-[22px] font-semibold",
              locked ? "text-strike" : "text-charcoal",
            )}
          >
            {title}
          </span>
          {showSummary && summary && (
            <span className="truncate text-[13px] text-muted">{summary}</span>
          )}
        </span>
        {showSummary && (
          <span className="text-[13px] font-medium underline underline-offset-[3px]">Editar</span>
        )}
      </button>
      {isOpen && (
        <div id={panelId} className="px-4 pt-1 pb-[18px]">
          {children}
        </div>
      )}
    </section>
  );
}

function RadioCard({
  selected,
  onSelect,
  className,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "grid items-center gap-3 rounded-card border text-left text-charcoal",
        selected ? "border-copper bg-copper-tint" : "border-line bg-white",
        className,
      )}
    >
      <span
        className={cx(
          "box-border flex size-5 items-center justify-center rounded-full border-[1.5px]",
          selected ? "border-copper" : "border-ring-off",
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-copper" />}
      </span>
      {children}
    </button>
  );
}

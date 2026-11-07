import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { discountPercent, type Coupon, type Hero } from "@/data/catalog";
import { moneyInput, parseMoney } from "@/admin/image";
import { ImagePicker } from "@/admin/image-picker";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Tabs,
  TextField,
  Toggle,
} from "@/admin/ui";
import { useFlash } from "@/admin/use-flash";
import { HeroBanner } from "@/components/hero-banner";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ProductPhoto } from "@/components/ui";
import { cx } from "@/lib/cx";
import { dbActions, StorageFullError, useCategories, useCoupons, useHero, useProducts } from "@/lib/db";
import { brl } from "@/lib/format";
import { useTitle } from "@/lib/title";

type Tab = "cupons" | "promocoes";

export function CouponsPage() {
  useTitle("Cupons e promoções");
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("aba") === "promocoes" ? "promocoes" : "cupons";

  return (
    <>
      <PageHeader title="Cupons e promoções" />
      <div className="mb-4">
        <Tabs<Tab>
          label="Seção"
          value={tab}
          onChange={(v) => setParams(v === "cupons" ? {} : { aba: v }, { replace: true })}
          items={[
            { value: "cupons", label: "Cupons de desconto" },
            { value: "promocoes", label: "Promoções e banner" },
          ]}
        />
      </div>
      {tab === "cupons" ? <CouponsTab /> : <PromotionsTab />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Cupons
// ---------------------------------------------------------------------------

function couponRule(c: Coupon) {
  const value = c.type === "percent" ? `${c.value}% de desconto` : `${brl(c.value)} de desconto`;
  return c.minSubtotal > 0 ? `${value} · compras a partir de ${brl(c.minSubtotal)}` : value;
}

function couponState(c: Coupon): { label: string; tone: "ok" | "neutral" | "danger" } {
  if (!c.active) return { label: "Pausado", tone: "neutral" };
  if (c.expiresAt && new Date(`${c.expiresAt}T23:59:59`) < new Date()) return { label: "Expirado", tone: "danger" };
  if (c.usageLimit !== null && c.used >= c.usageLimit) return { label: "Esgotado", tone: "danger" };
  return { label: "Ativo", tone: "ok" };
}

function CouponsTab() {
  const coupons = useCoupons();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const { flash, node } = useFlash();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-muted">A cliente digita o código no checkout, antes de finalizar.</p>
        {!editing && (
          <Button onClick={() => setEditing("new")}>
            <PlusIcon size={18} /> Novo cupom
          </Button>
        )}
      </div>

      {editing && (
        <CouponForm
          coupon={editing === "new" ? null : editing}
          existing={coupons}
          onDone={(msg) => {
            setEditing(null);
            if (msg) flash(msg);
          }}
        />
      )}

      <Card bodyClassName="">
        {coupons.length ? (
          <ul className="divide-y divide-line">
            {coupons.map((c) => {
              const st = couponState(c);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-field border border-dashed border-charcoal px-2 py-0.5 font-mono text-[14px] font-medium tracking-wider">
                        {c.code}
                      </span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </span>
                    <span className="text-[13px] text-body-2">{couponRule(c)}</span>
                    <span className="text-[12px] text-muted">
                      {c.used} {c.used === 1 ? "uso" : "usos"}
                      {c.usageLimit !== null && ` de ${c.usageLimit}`}
                      {c.expiresAt &&
                        ` · válido até ${new Date(`${c.expiresAt}T12:00:00`).toLocaleDateString("pt-BR")}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Toggle
                      checked={c.active}
                      onChange={(v) => dbActions.saveCoupon({ ...c, active: v })}
                      label={<span className="sr-only">{c.active ? "Pausar" : "Ativar"} {c.code}</span>}
                    />
                    <button
                      type="button"
                      aria-label={`Editar ${c.code}`}
                      onClick={() => setEditing(c)}
                      className="ml-2 flex size-9 items-center justify-center rounded-full hover:bg-icon-btn"
                    >
                      <PencilIcon size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${c.code}`}
                      onClick={() => {
                        if (window.confirm(`Excluir o cupom ${c.code}?`)) {
                          dbActions.deleteCoupon(c.id);
                          flash("Cupom excluído");
                        }
                      }}
                      className="flex size-9 items-center justify-center rounded-full text-error hover:bg-error-tint"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Nenhum cupom criado" />
        )}
      </Card>
      {node}
    </>
  );
}

function CouponForm({
  coupon,
  existing,
  onDone,
}: {
  coupon: Coupon | null;
  existing: Coupon[];
  onDone: (msg?: string) => void;
}) {
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<Coupon["type"]>(coupon?.type ?? "percent");
  const [value, setValue] = useState(coupon ? (coupon.type === "percent" ? String(coupon.value) : moneyInput(coupon.value)) : "");
  const [min, setMin] = useState(coupon?.minSubtotal ? moneyInput(coupon.minSubtotal) : "");
  const [expires, setExpires] = useState(coupon?.expiresAt ?? "");
  const [limit, setLimit] = useState(coupon?.usageLimit ? String(coupon.usageLimit) : "");
  const [active, setActive] = useState(coupon?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(c)) er.code = "Use de 3 a 20 letras ou números, sem espaços.";
    else if (existing.some((x) => x.code === c && x.id !== coupon?.id)) er.code = "Já existe um cupom com este código.";
    const v = type === "percent" ? Number(value.replace(",", ".")) : parseMoney(value);
    if (!(v > 0) || (type === "percent" && v > 90)) er.value = type === "percent" ? "De 1% a 90%." : "Informe o valor.";
    const m = min.trim() ? parseMoney(min) : 0;
    if (Number.isNaN(m) || m < 0) er.min = "Valor inválido.";
    const l = limit.trim() ? Number(limit) : null;
    if (l !== null && !(Number.isInteger(l) && l > 0)) er.limit = "Número inteiro maior que zero.";
    setErrors(er);
    if (Object.keys(er).length) return;
    dbActions.saveCoupon({
      id: coupon?.id,
      code: c,
      type,
      value: v,
      minSubtotal: m,
      expiresAt: expires || null,
      usageLimit: l,
      active,
      used: coupon?.used,
    });
    onDone(coupon ? "Cupom atualizado" : "Cupom criado");
  }

  return (
    <Card title={coupon ? `Editar ${coupon.code}` : "Novo cupom"} className="mb-4">
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField
          label="Código"
          placeholder="Ex.: VERAO15"
          value={code}
          error={errors.code}
          autoCapitalize="characters"
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
        />
        <Select label="Tipo de desconto" value={type} onChange={(e) => setType(e.target.value as Coupon["type"])}>
          <option value="percent">Porcentagem (%)</option>
          <option value="fixed">Valor fixo (R$)</option>
        </Select>
        <TextField
          label={type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
          prefix={type === "percent" ? "%" : "R$"}
          inputMode="decimal"
          value={value}
          error={errors.value}
          onChange={(e) => setValue(e.target.value)}
        />
        <TextField
          label="Compra mínima (opcional)"
          prefix="R$"
          inputMode="decimal"
          value={min}
          error={errors.min}
          onChange={(e) => setMin(e.target.value)}
        />
        <TextField
          label="Válido até (opcional)"
          type="date"
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
        />
        <TextField
          label="Limite de usos (opcional)"
          inputMode="numeric"
          value={limit}
          error={errors.limit}
          onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <Toggle checked={active} onChange={setActive} label="Cupom ativo" />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit">{coupon ? "Salvar cupom" : "Criar cupom"}</Button>
          <Button variant="ghost" onClick={() => onDone()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Promoções: banner da home + preço promocional por produto
// ---------------------------------------------------------------------------

function PromotionsTab() {
  return (
    <div className="flex flex-col gap-4">
      <HeroEditor />
      <PromoPrices />
    </div>
  );
}

function HeroEditor() {
  const saved = useHero();
  const categories = useCategories();
  const [hero, setHero] = useState<Hero>(saved);
  const [error, setError] = useState("");
  const { flash, node } = useFlash();
  const dirty = JSON.stringify(hero) !== JSON.stringify(saved);
  const set = <K extends keyof Hero>(k: K, v: Hero[K]) => setHero((h) => ({ ...h, [k]: v }));

  function save() {
    if (!hero.title.trim()) return setError("O banner precisa de um título.");
    if (!hero.cta.trim()) return setError("Escreva o texto do botão.");
    try {
      dbActions.saveHero({ ...hero, title: hero.title.trim(), cta: hero.cta.trim(), tag: hero.tag.trim() });
      setError("");
      flash("Banner salvo");
    } catch (e) {
      setError(e instanceof StorageFullError ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <Card
      title="Banner da página inicial"
      description="Aparece no topo da vitrine, antes do catálogo."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Toggle checked={hero.enabled} onChange={(v) => set("enabled", v)} label="Mostrar banner na loja" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Selo (opcional)"
              placeholder="Ex.: Até 20% off"
              maxLength={24}
              value={hero.tag}
              onChange={(e) => set("tag", e.target.value)}
            />
            <TextField
              label="Texto do botão"
              maxLength={22}
              value={hero.cta}
              onChange={(e) => set("cta", e.target.value)}
            />
            <TextField
              className="sm:col-span-2"
              label="Título"
              maxLength={40}
              value={hero.title}
              hint={`${hero.title.length}/30 caracteres recomendados (o banner tem altura fixa).`}
              onChange={(e) => set("title", e.target.value)}
            />
            <Select
              className="sm:col-span-2"
              label="O botão abre"
              value={hero.target}
              onChange={(e) => set("target", e.target.value)}
            >
              <option value="promocao">Promoção</option>
              <option value="novidades">Novidades</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-body-2">Foto do banner (4:5 · 1080×1350)</span>
            <ImagePicker
              value={hero.image ? [hero.image] : []}
              onChange={(v) => set("image", v[0] ?? "")}
              max={1}
              labels={["Foto da campanha"]}
            />
          </div>
          <TextField
            label="Descrição da foto (acessibilidade)"
            value={hero.imageAlt}
            onChange={(e) => set("imageAlt", e.target.value)}
          />
          {error && <p className="text-[13px] font-medium text-error">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={!dirty}>
              Salvar banner
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => setHero(saved)}>
                Descartar
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-body-2">Prévia (celular)</span>
          <div className={cx("w-full max-w-[375px] rounded-tile bg-alabaster py-4", !hero.enabled && "opacity-50")}>
            <HeroBanner hero={hero} />
          </div>
          {!hero.enabled && <p className="text-[12px] text-muted">Banner desligado: não aparece na loja.</p>}
        </div>
      </div>
      {node}
    </Card>
  );
}

function PromoPrices() {
  const products = useProducts();
  const { flash, node } = useFlash();
  const list = products.filter((p) => p.active);

  return (
    <Card
      title="Preços promocionais"
      description='Produto com preço promocional entra na vitrine "Promoção" e ganha a etiqueta de desconto. Deixe vazio para tirar da promoção.'
      bodyClassName=""
    >
      {list.length ? (
        <ul className="divide-y divide-line">
          {list.map((p) => (
            <PromoRow
              key={`${p.id}-${p.price}-${p.oldPrice}`}
              product={p}
              onSaved={(msg) => flash(msg)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState title="Nenhum produto na loja" />
      )}
      {node}
    </Card>
  );
}

function PromoRow({
  product: p,
  onSaved,
}: {
  product: ReturnType<typeof useProducts>[number];
  onSaved: (msg: string) => void;
}) {
  const onSale = discountPercent(p) > 0;
  const normal = onSale ? (p.oldPrice as number) : p.price;
  const [value, setValue] = useState(onSale ? moneyInput(p.price) : "");
  const [error, setError] = useState("");
  const promo = value.trim() ? parseMoney(value) : null;
  const off = promo !== null && promo > 0 && promo < normal ? Math.round((1 - promo / normal) * 100) : 0;
  const changed = (promo ?? null) !== (onSale ? p.price : null);

  function save() {
    if (promo !== null && !(promo > 0 && promo < normal)) {
      setError(`Precisa ser menor que ${brl(normal)}.`);
      return;
    }
    dbActions.saveProduct({ ...p, price: promo ?? normal, oldPrice: promo !== null ? normal : null });
    onSaved(promo !== null ? `${p.name} em promoção` : `${p.name} saiu da promoção`);
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
      <ProductPhoto src={p.images[0]} alt="" stripe={5} className="h-[60px] w-12 flex-none rounded-thumb" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-semibold">{p.name}</span>
        <span className="text-[13px] text-muted">Preço normal {brl(normal)}</span>
      </div>
      <form
        className="flex flex-wrap items-start gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="relative">
            <span className="sr-only">Preço promocional de {p.name}</span>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[14px] text-muted">R$</span>
            <input
              inputMode="decimal"
              placeholder="Sem promoção"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              className={cx(
                "h-10 w-36 rounded-field border bg-white pr-3 pl-9 text-[15px] outline-none focus:border-copper",
                error ? "border-error" : "border-line",
              )}
            />
          </label>
          {error && <span className="text-[12px] text-error">{error}</span>}
        </div>
        <span className="flex h-10 w-14 items-center">{off > 0 && <Badge tone="copper">−{off}%</Badge>}</span>
        <Button type="submit" size="sm" variant="secondary" disabled={!changed} className="h-10">
          Aplicar
        </Button>
      </form>
    </li>
  );
}

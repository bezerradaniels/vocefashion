import { useState } from "react";
import { formatMinutes, SEED_SETTINGS, type Settings, type ShippingMethod } from "@/data/catalog";
import { moneyInput, parseMoney } from "@/admin/image";
import { ImagePicker } from "@/admin/image-picker";
import { Button, Card, PageHeader, Select, TextArea, TextField, Toggle } from "@/admin/ui";
import { useFlash } from "@/admin/use-flash";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { dbActions, DEMO_MODE, errorMessage, useSettings } from "@/lib/db";
import { digits, formatPhone } from "@/lib/format";
import { useTitle } from "@/lib/title";

/** Na tela os valores em R$ são texto ("7,00"); viram número só ao salvar. */
type MethodForm = Omit<ShippingMethod, "price" | "freeAbove"> & { price: string; freeAbove: string };
type Form = Omit<Settings, "shipping"> & {
  shipping: Omit<Settings["shipping"], "methods"> & { methods: MethodForm[] };
};

const toForm = (s: Settings): Form => ({
  ...s,
  phone: formatPhone(s.phone),
  shipping: {
    ...s.shipping,
    methods: s.shipping.methods.map((m) => ({
      ...m,
      price: moneyInput(m.price),
      freeAbove: m.freeAbove === null ? "" : moneyInput(m.freeAbove),
    })),
  },
});

export function StoreSettingsPage() {
  useTitle("Dados da loja");
  const saved = useSettings();
  const [form, setForm] = useState<Form>(() => toForm(saved));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { flash, node } = useFlash();
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(saved));

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k as string]: "", save: "" }));
  };
  const setPay = (patch: Partial<Form["payments"]["pix"]> | Partial<Form["payments"]["card"]>, key: "pix" | "card") =>
    setForm((f) => ({ ...f, payments: { ...f.payments, [key]: { ...f.payments[key], ...patch } } }));
  const setShip = (patch: Partial<Form["shipping"]>) => setForm((f) => ({ ...f, shipping: { ...f.shipping, ...patch } }));
  const setMethod = (i: number, patch: Partial<MethodForm>) =>
    setShip({ methods: form.shipping.methods.map((m, k) => (k === i ? { ...m, ...patch } : m)) });

  async function save() {
    if (saving) return;
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome da loja.";
    const phone = digits(form.phone);
    if (phone && phone.length < 10) e.phone = "Informe DDD + número.";
    const ig = form.instagram.trim().replace(/^@/, "");
    if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) e.instagram = "Só letras, números, ponto e _.";
    if (!form.payments.pix.enabled && !form.payments.card.enabled) e.payments = "Deixe pelo menos uma forma de pagamento ativa.";
    if (form.payments.pix.discountPercent < 0 || form.payments.pix.discountPercent > 30) e.pix = "Entre 0% e 30%.";
    const expiry = form.payments.pix.expiryMinutes;
    if (!Number.isInteger(expiry) || expiry < 0 || expiry > 10080) e.pixExpiry = "Entre 0 e 10080 minutos (7 dias).";
    if (form.payments.card.installments < 1 || form.payments.card.installments > 12) e.card = "Entre 1 e 12 parcelas.";
    if (!/^\d{1,8}$/.test(form.shipping.localCepPrefix)) e.cep = "Use só números (ex.: 476).";

    const methods: ShippingMethod[] = [];
    form.shipping.methods.forEach((m, i) => {
      const price = m.pickup ? 0 : parseMoney(m.price || "0");
      const freeAbove = m.freeAbove.trim() ? parseMoney(m.freeAbove) : null;
      if (!m.name.trim()) e[`m${i}`] = "Dê um nome para esta forma de entrega.";
      else if (Number.isNaN(price) || price < 0) e[`m${i}`] = "Preço inválido.";
      else if (freeAbove !== null && (Number.isNaN(freeAbove) || freeAbove <= 0)) e[`m${i}`] = '"Grátis acima de" inválido.';
      methods.push({ ...m, name: m.name.trim(), sub: m.sub.trim(), price, freeAbove: m.pickup ? null : freeAbove });
    });
    if (!methods.some((m) => m.enabled)) e.methods = "Deixe pelo menos uma forma de entrega ativa.";

    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await dbActions.saveSettings({
        ...form,
        name: form.name.trim(),
        phone,
        instagram: ig,
        shipping: { ...form.shipping, methods },
      });
      flash("Dados da loja salvos");
    } catch (err) {
      setErrors({ save: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Dados da loja" subtitle="Informações que aparecem na loja e regras de pagamento e entrega." />

      <div className="flex flex-col gap-4 pb-24">
        <Card title="Identidade">
          <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-body-2">Logo</span>
              <ImagePicker
                value={form.logo ? [form.logo] : []}
                onChange={(v) => set("logo", v[0] ?? "")}
                max={1}
                labels={["Logo"]}
                aspect="aspect-square"
                resize={{ maxW: 512, maxH: 512, type: "image/png" }}
              />
              {form.logo !== SEED_SETTINGS.logo && (
                <button
                  type="button"
                  onClick={() => set("logo", SEED_SETTINGS.logo)}
                  className="self-start text-[12px] font-medium underline underline-offset-[3px]"
                >
                  Usar logo original
                </button>
              )}
              <span className="text-[12px] text-muted">Quadrada, de preferência PNG com fundo transparente.</span>
            </div>
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <TextField
                label="Nome da loja"
                value={form.name}
                error={errors.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <TextField
                label="Endereço"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
              <TextArea
                className="sm:col-span-2"
                label="Descrição da loja"
                hint="Aparece no rodapé da vitrine."
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card title="Contato">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Telefone / WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="(77) 99999-9999"
              value={form.phone}
              error={errors.phone}
              hint="Para onde as clientes enviam o pedido depois de finalizar no site (e botão no rodapé)."
              onChange={(e) => set("phone", formatPhone(e.target.value))}
            />
            <TextField
              label="Instagram"
              prefix="@"
              placeholder="vocefashion"
              value={form.instagram.replace(/^@/, "")}
              error={errors.instagram}
              hint="Só o usuário, sem o link."
              onChange={(e) => set("instagram", e.target.value.replace(/^@/, "").trim())}
            />
          </div>
        </Card>

        <Card title="Formas de pagamento" description="Preferências que a cliente indica ao enviar o pedido. Nada é cobrado no site: o pagamento é combinado pelo WhatsApp, Instagram ou aqui no painel.">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-card border border-line p-4">
              <Toggle
                checked={form.payments.pix.enabled}
                onChange={(v) => setPay({ enabled: v }, "pix")}
                label="Pix"
                description="O desconto aparece nos valores da loja e do pedido."
              />
              <TextField
                label="Desconto no Pix (%)"
                type="number"
                min={0}
                max={30}
                disabled={!form.payments.pix.enabled}
                value={String(form.payments.pix.discountPercent)}
                error={errors.pix}
                onChange={(e) => setPay({ discountPercent: Number(e.target.value) }, "pix")}
              />
              <Select
                label="Prazo para pagar o Pix"
                disabled={!form.payments.pix.enabled}
                value={String(form.payments.pix.expiryMinutes ?? 0)}
                error={errors.pixExpiry}
                hint="Depois do prazo, o pedido é cancelado sozinho e as peças voltam para a loja."
                onChange={(e) => setPay({ expiryMinutes: Number(e.target.value) }, "pix")}
              >
                {[...new Set([30, 60, 120, 240, 720, 1440, 2880, form.payments.pix.expiryMinutes ?? 0])]
                  .filter((m) => m > 0)
                  .sort((a, b) => a - b)
                  .map((m) => (
                    <option key={m} value={m}>
                      {formatMinutes(m)}
                    </option>
                  ))}
                <option value={0}>Não cancelar sozinho</option>
              </Select>
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line p-4">
              <Toggle
                checked={form.payments.card.enabled}
                onChange={(v) => setPay({ enabled: v }, "card")}
                label="Cartão de crédito"
                description="As parcelas aparecem como informação; a loja envia o link de pagamento."
              />
              <Select
                label="Parcelas sem juros"
                disabled={!form.payments.card.enabled}
                value={String(form.payments.card.installments)}
                error={errors.card}
                onChange={(e) => setPay({ installments: Number(e.target.value) }, "card")}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? "À vista" : `Até ${n}x`}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {errors.payments && <p className="mt-3 text-[13px] font-medium text-error">{errors.payments}</p>}
        </Card>

        <Card title="Formas de entrega" description="Opções calculadas pelo CEP no checkout.">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Início do CEP da cidade"
              inputMode="numeric"
              value={form.shipping.localCepPrefix}
              error={errors.cep}
              hint="CEPs que começam assim veem as opções locais (Bom Jesus da Lapa: 476)."
              onChange={(e) => setShip({ localCepPrefix: e.target.value.replace(/\D/g, "") })}
            />
            <TextField
              label="Nome da cidade"
              value={form.shipping.localCityLabel}
              onChange={(e) => setShip({ localCityLabel: e.target.value })}
            />
          </div>

          <ul className="flex flex-col gap-3">
            {form.shipping.methods.map((m, i) => (
              <li key={m.id} className="flex flex-col gap-3 rounded-card border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Toggle checked={m.enabled} onChange={(v) => setMethod(i, { enabled: v })} label={m.name || "Nova forma de entrega"} />
                  <button
                    type="button"
                    aria-label={`Remover ${m.name || "forma de entrega"}`}
                    onClick={() => setShip({ methods: form.shipping.methods.filter((_, k) => k !== i) })}
                    className="flex size-9 items-center justify-center rounded-full text-error hover:bg-error-tint"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TextField label="Nome" value={m.name} onChange={(e) => setMethod(i, { name: e.target.value })} />
                  <TextField
                    className="lg:col-span-3"
                    label="Prazo / detalhe"
                    value={m.sub}
                    onChange={(e) => setMethod(i, { sub: e.target.value })}
                  />
                  <Select
                    label="Para quem"
                    value={m.scope}
                    onChange={(e) => setMethod(i, { scope: e.target.value as ShippingMethod["scope"] })}
                  >
                    <option value="local">Só na cidade</option>
                    <option value="national">Todo o Brasil</option>
                  </Select>
                  <Select
                    label="Tipo"
                    value={m.pickup ? "pickup" : "delivery"}
                    onChange={(e) => setMethod(i, { pickup: e.target.value === "pickup" })}
                  >
                    <option value="delivery">Entrega (pede endereço)</option>
                    <option value="pickup">Retirada na loja</option>
                  </Select>
                  <TextField
                    label="Preço"
                    prefix="R$"
                    inputMode="decimal"
                    disabled={m.pickup}
                    value={m.pickup ? "0,00" : m.price}
                    onChange={(e) => setMethod(i, { price: e.target.value })}
                  />
                  <TextField
                    label="Grátis acima de (opcional)"
                    prefix="R$"
                    inputMode="decimal"
                    disabled={m.pickup}
                    value={m.pickup ? "" : m.freeAbove}
                    onChange={(e) => setMethod(i, { freeAbove: e.target.value })}
                  />
                </div>
                {errors[`m${i}`] && <p className="text-[13px] font-medium text-error">{errors[`m${i}`]}</p>}
              </li>
            ))}
          </ul>
          {errors.methods && <p className="mt-3 text-[13px] font-medium text-error">{errors.methods}</p>}
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              setShip({
                methods: [
                  ...form.shipping.methods,
                  {
                    id: `m-${Date.now()}`,
                    name: "",
                    sub: "",
                    price: "",
                    enabled: true,
                    scope: "national",
                    pickup: false,
                    freeAbove: "",
                  },
                ],
              })
            }
          >
            <PlusIcon size={16} /> Adicionar forma de entrega
          </Button>
        </Card>

        {DEMO_MODE && (
        <Card title="Dados de demonstração">
          <p className="mb-3 text-[13px] text-muted">
            Apaga tudo o que foi alterado neste navegador (produtos, pedidos, cupons, dados da loja) e volta ao
            exemplo inicial.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (!window.confirm("Restaurar os dados de demonstração? Todas as alterações feitas aqui serão perdidas.")) return;
              void dbActions.resetDemo().then(() => window.location.reload());
            }}
          >
            Restaurar dados de demonstração
          </Button>
        </Card>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="mr-auto text-[13px] font-medium">
            {errors.save ? (
              <span className="text-error">{errors.save}</span>
            ) : Object.values(errors).some(Boolean) ? (
              <span className="text-error">Confira os campos marcados.</span>
            ) : dirty ? (
              <span className="text-body-2">Alterações não salvas</span>
            ) : null}
          </p>
          {dirty && (
            <Button variant="ghost" onClick={() => setForm(toForm(saved))}>
              Descartar
            </Button>
          )}
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>
      {node}
    </>
  );
}

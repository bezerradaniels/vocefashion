import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { SIZES, slugify, type Product, type Size } from "@/data/catalog";
import { moneyInput, parseMoney } from "@/admin/image";
import { ImagePicker } from "@/admin/image-picker";
import { Badge, Button, Card, EmptyState, PageHeader, Select, TextArea, TextField, Toggle } from "@/admin/ui";
import { useFlash } from "@/admin/use-flash";
import { dbActions, errorMessage, useCategories, useProducts } from "@/lib/db";
import { useTitle } from "@/lib/title";
import { pageUrl } from "@/lib/asset";

type Form = {
  name: string;
  slug: string;
  slugTouched: boolean;
  categoryId: string;
  price: string;
  promo: string;
  stock: Record<Size, string>;
  description: string;
  descriptionMore: string;
  images: string[];
  active: boolean;
};

type Errors = Partial<Record<"name" | "slug" | "categoryId" | "price" | "promo" | "description" | "save", string>>;

function toForm(p: Product | undefined, firstCategory: string): Form {
  if (!p)
    return {
      name: "",
      slug: "",
      slugTouched: false,
      categoryId: firstCategory,
      price: "",
      promo: "",
      stock: { P: "0", M: "0", G: "0", GG: "0" },
      description: "",
      descriptionMore: "",
      images: [],
      active: true,
    };
  const onSale = p.oldPrice !== null && p.oldPrice > p.price;
  return {
    name: p.name,
    slug: p.slug,
    slugTouched: true,
    categoryId: p.categoryId,
    // Na tela: "preço" é o normal e "promocional" é o com desconto.
    price: moneyInput(onSale ? p.oldPrice : p.price),
    promo: onSale ? moneyInput(p.price) : "",
    stock: Object.fromEntries(SIZES.map((s) => [s, String(p.stock[s])])) as Record<Size, string>,
    description: p.description,
    descriptionMore: p.descriptionMore,
    images: p.images,
    active: p.active,
  };
}

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useProducts();
  const categories = useCategories();
  const editing = id ? products.find((p) => p.id === Number(id)) : undefined;
  const isNew = !id;
  useTitle(isNew ? "Novo produto" : editing ? editing.name : "Produto não encontrado");

  const [form, setForm] = useState<Form>(() => toForm(editing, categories[0]?.id ?? ""));
  const [errors, setErrors] = useState<Errors>({});
  const { flash, node } = useFlash();
  const [saving, setSaving] = useState(false);

  if (!isNew && !editing) {
    return (
      <>
        <PageHeader title="Produto não encontrado" back={{ to: "/admin/produtos", label: "Produtos" }} />
        <Card>
          <EmptyState title="Este produto não existe ou foi excluído." />
        </Card>
      </>
    );
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, save: undefined }));
  };

  const price = parseMoney(form.price);
  const promo = form.promo.trim() ? parseMoney(form.promo) : null;
  const off = promo !== null && price > 0 && promo < price ? Math.round((1 - promo / price) * 100) : 0;

  function validate(): Errors {
    const e: Errors = {};
    if (form.name.trim().length < 3) e.name = "Dê um nome com pelo menos 3 letras.";
    const slug = slugify(form.slug || form.name);
    if (!slug) e.slug = "Informe o endereço da página.";
    else if (products.some((p) => p.slug === slug && p.id !== editing?.id))
      e.slug = "Já existe outro produto com este endereço.";
    if (!form.categoryId) e.categoryId = "Escolha uma categoria.";
    if (!(price > 0)) e.price = "Informe o preço (ex.: 189,90).";
    if (promo !== null && !(promo > 0 && promo < price))
      e.promo = "O preço promocional precisa ser menor que o preço normal.";
    if (!form.description.trim()) e.description = "Escreva uma descrição curta.";
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (saving) return;
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const slug = slugify(form.slug || form.name);
    const stock = Object.fromEntries(
      SIZES.map((s) => [s, Math.max(0, Math.floor(Number(form.stock[s]) || 0))]),
    ) as Record<Size, number>;
    setSaving(true);
    try {
      const savedId = await dbActions.saveProduct({
        id: editing?.id,
        slug,
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: promo ?? price,
        oldPrice: promo !== null ? price : null,
        stock,
        description: form.description.trim(),
        descriptionMore: form.descriptionMore.trim(),
        images: form.images,
        photoLabel: editing?.photoLabel ?? `foto · ${form.name.trim().toLowerCase()}`,
        active: form.active,
      });
      if (isNew) navigate(`/admin/produtos/${savedId}`, { replace: true });
      flash(isNew ? "Produto criado" : "Alterações salvas");
    } catch (err) {
      setErrors({ save: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!editing) return;
    if (!window.confirm(`Excluir "${editing.name}"? Esta ação não pode ser desfeita.`)) return;
    dbActions.deleteProduct(editing.id).then(
      () => navigate("/admin/produtos", { replace: true }),
      (err) => setErrors({ save: errorMessage(err, "Não foi possível excluir.") }),
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        back={{ to: "/admin/produtos", label: "Produtos" }}
        title={isNew ? "Novo produto" : editing!.name}
        actions={
          editing && editing.active ? (
            <a
              href={pageUrl(`/produto/${editing.slug}`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3.5 text-[14px] font-semibold hover:border-charcoal"
            >
              Ver na loja
            </a>
          ) : undefined
        }
      />

      <div className="grid gap-4 pb-24 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card title="Informações">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                className="sm:col-span-2"
                label="Nome do produto"
                value={form.name}
                error={errors.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: f.slugTouched ? f.slug : slugify(name) }));
                  setErrors((er) => ({ ...er, name: undefined, slug: undefined }));
                }}
              />
              <TextField
                label="Endereço da página"
                prefix="/"
                value={form.slug}
                error={errors.slug}
                hint={`loja/produto/${slugify(form.slug || form.name) || "..."}`}
                onChange={(e) => {
                  set("slug", e.target.value);
                  set("slugTouched", true);
                }}
              />
              <Select
                label="Categoria"
                value={form.categoryId}
                error={errors.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                {!categories.length && <option value="">Crie uma categoria primeiro</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.active ? "" : " (oculta)"}
                  </option>
                ))}
              </Select>
              <TextArea
                className="sm:col-span-2"
                label="Descrição"
                hint="Aparece logo abaixo do tamanho, na página do produto."
                value={form.description}
                error={errors.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <TextArea
                className="sm:col-span-2"
                label="Detalhes (opcional)"
                hint='Composição, medidas, cuidados. Aparece ao tocar em "Ler mais".'
                value={form.descriptionMore}
                onChange={(e) => set("descriptionMore", e.target.value)}
              />
            </div>
          </Card>

          <Card title="Fotos" description="Até 10 fotos na vertical (4:5, 1080×1350, como no feed do Instagram). A primeira é a capa; use as setas para mudar a ordem.">
            <ImagePicker value={form.images} onChange={(v) => set("images", v)} />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Visibilidade">
            <Toggle
              checked={form.active}
              onChange={(v) => set("active", v)}
              label="Mostrar na loja"
              description="Desligado, o produto some da vitrine e da sacola das clientes."
            />
          </Card>

          <Card title="Preço">
            <div className="flex flex-col gap-4">
              <TextField
                label="Preço"
                prefix="R$"
                inputMode="decimal"
                placeholder="189,90"
                value={form.price}
                error={errors.price}
                onChange={(e) => set("price", e.target.value)}
              />
              <TextField
                label={
                  <span className="flex items-center gap-2">
                    Preço promocional (opcional) {off > 0 && <Badge tone="copper">−{off}%</Badge>}
                  </span>
                }
                prefix="R$"
                inputMode="decimal"
                placeholder="Deixe vazio se não estiver em promoção"
                value={form.promo}
                error={errors.promo}
                hint="Na loja, o preço normal aparece riscado ao lado."
                onChange={(e) => set("promo", e.target.value)}
              />
            </div>
          </Card>

          <Card title="Estoque por tamanho">
            <div className="grid grid-cols-4 gap-3">
              {SIZES.map((s) => (
                <TextField
                  key={s}
                  label={s}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.stock[s]}
                  onChange={(e) => set("stock", { ...form.stock, [s]: e.target.value })}
                />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">Tamanho com 0 aparece riscado (esgotado) na loja.</p>
          </Card>

          {editing && (
            <Card title="Excluir produto">
              <p className="mb-3 text-[13px] text-muted">
                Prefira ocultar se for voltar a vender. Pedidos antigos continuam com o nome do produto.
              </p>
              <Button variant="danger" size="sm" onClick={remove}>
                Excluir produto
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Barra de salvar fixa */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {errors.save && <p className="mr-auto text-[13px] font-medium text-error">{errors.save}</p>}
          {!errors.save && Object.values(errors).some(Boolean) && (
            <p className="mr-auto text-[13px] font-medium text-error">Confira os campos marcados.</p>
          )}
          <Link to="/admin/produtos" className="h-11 px-4 text-[15px] leading-[44px] font-semibold">
            Cancelar
          </Link>
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : isNew ? "Criar produto" : "Salvar"}</Button>
        </div>
      </div>
      {node}
    </form>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { discountPercent, SIZES } from "@/data/catalog";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Tabs } from "@/admin/ui";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { ProductPhoto } from "@/components/ui";
import { cx } from "@/lib/cx";
import { dbActions, useCategories, useProducts } from "@/lib/db";
import { brl } from "@/lib/format";
import { useTitle } from "@/lib/title";
import { useFlash } from "@/admin/use-flash";

type Filter = "todos" | "ativos" | "inativos" | "promocao" | "sem-estoque";

export function ProductsPage() {
  useTitle("Produtos");
  const products = useProducts();
  const categories = useCategories();
  const [filter, setFilter] = useState<Filter>("todos");
  const [cat, setCat] = useState("todas");
  const [q, setQ] = useState("");
  const { run, node } = useFlash();

  const total = (p: (typeof products)[number]) => SIZES.reduce((n, s) => n + p.stock[s], 0);

  const list = products.filter((p) => {
    if (filter === "ativos" && !p.active) return false;
    if (filter === "inativos" && p.active) return false;
    if (filter === "promocao" && !discountPercent(p)) return false;
    if (filter === "sem-estoque" && total(p) > 0) return false;
    if (cat !== "todas" && p.categoryId !== cat) return false;
    const term = q.trim().toLowerCase();
    return !term || p.name.toLowerCase().includes(term);
  });

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produtos cadastrados`}
        actions={
          <ButtonLink to="/admin/produtos/novo">
            <PlusIcon size={18} /> Novo produto
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <Tabs<Filter>
          label="Filtrar produtos"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "todos", label: "Todos", count: products.length },
            { value: "ativos", label: "Na loja", count: products.filter((p) => p.active).length },
            { value: "inativos", label: "Ocultos", count: products.filter((p) => !p.active).length },
            { value: "promocao", label: "Em promoção", count: products.filter((p) => discountPercent(p) > 0).length },
            { value: "sem-estoque", label: "Sem estoque", count: products.filter((p) => total(p) === 0).length },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <label className="relative block min-w-[220px] flex-1 sm:max-w-sm">
            <span className="sr-only">Buscar produto</span>
            <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar pelo nome"
              className="h-11 w-full rounded-full border border-line bg-white pr-4 pl-10 text-[15px] outline-none focus:border-copper"
            />
          </label>
          <label className="sr-only" htmlFor="cat-filter">
            Categoria
          </label>
          <select
            id="cat-filter"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-11 rounded-full border border-line bg-white px-4 text-[15px] outline-none focus:border-copper"
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card bodyClassName="">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((p) => {
              const off = discountPercent(p);
              const stock = total(p);
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Link to={`/admin/produtos/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <ProductPhoto
                      src={p.images[0]}
                      alt=""
                      stripe={5}
                      className="h-[60px] w-12 flex-none rounded-thumb"
                    />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-[14px] font-semibold hover:underline">{p.name}</span>
                      <span className="text-[12px] text-muted">
                        {categories.find((c) => c.id === p.categoryId)?.name ?? "Sem categoria"}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                        <span className="font-bold">{brl(p.price)}</span>
                        {off > 0 && p.oldPrice && (
                          <>
                            <span className="text-strike line-through">{brl(p.oldPrice)}</span>
                            <Badge tone="copper">−{off}%</Badge>
                          </>
                        )}
                      </span>
                    </span>
                  </Link>
                  <span className="hidden w-44 flex-none text-[12px] text-body-2 md:block">
                    {SIZES.map((s) => (
                      <span key={s} className={cx("mr-2", p.stock[s] === 0 && "text-out-fg line-through")}>
                        {s} {p.stock[s]}
                      </span>
                    ))}
                    <span className="mt-0.5 block text-muted">{stock} em estoque</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.active}
                    aria-label={p.active ? `Ocultar ${p.name} da loja` : `Mostrar ${p.name} na loja`}
                    onClick={() => void run(dbActions.saveProduct({ ...p, active: !p.active }), p.active ? `${p.name} oculto da loja` : `${p.name} visível na loja`)}
                    className="flex flex-none items-center gap-2 text-[12px] font-medium text-body-2"
                    title={p.active ? "Visível na loja" : "Oculto da loja"}
                  >
                    <span className={cx("relative h-6 w-10 rounded-full transition-colors", p.active ? "bg-copper" : "bg-[#D5D3D0]")}>
                      <span className={cx("absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform", p.active && "translate-x-4")} />
                    </span>
                    <span className="hidden w-12 text-left sm:inline">{p.active ? "Na loja" : "Oculto"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Nenhum produto encontrado">
            {products.length ? "Ajuste os filtros ou a busca." : "Cadastre o primeiro produto da loja."}
          </EmptyState>
        )}
      </Card>
      {node}
    </>
  );
}

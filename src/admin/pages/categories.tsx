import { useState, type FormEvent } from "react";
import { slugify } from "@/data/catalog";
import { Button, Card, EmptyState, PageHeader, TextField, Toggle } from "@/admin/ui";
import { useFlash } from "@/admin/use-flash";
import { ArrowUpIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { dbActions, useCategories, useProducts } from "@/lib/db";
import { useTitle } from "@/lib/title";

export function CategoriesPage() {
  useTitle("Categorias");
  const categories = useCategories();
  const products = useProducts();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { run, node } = useFlash();

  const exists = (n: string, except?: string) =>
    categories.some((c) => c.id !== except && c.name.trim().toLowerCase() === n.trim().toLowerCase());

  function add(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setError("Digite o nome da categoria.");
    if (["novidades", "promoção", "promocao"].includes(n.toLowerCase()))
      return setError(`"${n}" já é uma vitrine automática da loja.`);
    if (exists(n)) return setError("Já existe uma categoria com este nome.");
    const base = slugify(n) || "categoria";
    let id = base;
    for (let i = 2; categories.some((c) => c.id === id); i++) id = `${base}-${i}`;
    setName("");
    void run(dbActions.saveCategory({ id, name: n, active: true }), "Categoria criada");
  }

  function rename(id: string) {
    const n = editName.trim();
    if (n.length < 2 || exists(n, id)) return;
    const c = categories.find((x) => x.id === id);
    setEditing(null);
    if (c) void run(dbActions.saveCategory({ ...c, name: n }), "Nome atualizado");
  }

  function remove(id: string, label: string, count: number) {
    if (count > 0) {
      window.alert(`"${label}" tem ${count} produto(s). Mude a categoria desses produtos antes de excluir.`);
      return;
    }
    if (!window.confirm(`Excluir a categoria "${label}"?`)) return;
    void run(dbActions.deleteCategory(id), "Categoria excluída");
  }

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle='Viram as pílulas da vitrine, nesta ordem. "Novidades" e "Promoção" são automáticas.'
      />

      <Card className="mb-4">
        <form onSubmit={add} noValidate className="flex flex-wrap items-start gap-3">
          <TextField
            className="min-w-[220px] flex-1"
            label="Nova categoria"
            placeholder="Ex.: Macacões"
            value={name}
            error={error}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
          <Button type="submit" className="sm:mt-[26px]">
            Adicionar
          </Button>
        </form>
      </Card>

      <Card bodyClassName="">
        {categories.length ? (
          <ul className="divide-y divide-line">
            {categories.map((c, i) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label={`Subir ${c.name}`}
                      disabled={i === 0}
                      onClick={() => void run(dbActions.moveCategory(c.id, -1), "")}
                      className="flex size-7 items-center justify-center rounded-full hover:bg-icon-btn disabled:opacity-25"
                    >
                      <ArrowUpIcon size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Descer ${c.name}`}
                      disabled={i === categories.length - 1}
                      onClick={() => void run(dbActions.moveCategory(c.id, 1), "")}
                      className="flex size-7 items-center justify-center rounded-full hover:bg-icon-btn disabled:opacity-25"
                    >
                      <ArrowUpIcon size={16} className="rotate-180" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    {editing === c.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          rename(c.id);
                        }}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          autoFocus
                          aria-label="Nome da categoria"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-field border border-copper px-3 text-[15px] outline-none"
                        />
                        <Button type="submit" size="sm">
                          Salvar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                          Cancelar
                        </Button>
                      </form>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold">{c.name}</span>
                        <span className="text-[12px] text-muted">
                          {count} {count === 1 ? "produto" : "produtos"}
                        </span>
                      </div>
                    )}
                  </div>

                  {editing !== c.id && (
                    <div className="flex items-center gap-1">
                      <Toggle
                        checked={c.active}
                        onChange={(v) => void run(dbActions.saveCategory({ ...c, active: v }), v ? "Categoria visível na loja" : "Categoria oculta da loja")}
                        label={<span className="hidden text-[13px] sm:inline">{c.active ? "Na loja" : "Oculta"}</span>}
                      />
                      <button
                        type="button"
                        aria-label={`Renomear ${c.name}`}
                        onClick={() => {
                          setEditing(c.id);
                          setEditName(c.name);
                        }}
                        className="ml-2 flex size-9 items-center justify-center rounded-full hover:bg-icon-btn"
                      >
                        <PencilIcon size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${c.name}`}
                        onClick={() => remove(c.id, c.name, count)}
                        className="flex size-9 items-center justify-center rounded-full text-error hover:bg-error-tint"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Nenhuma categoria">Crie a primeira categoria acima.</EmptyState>
        )}
      </Card>
      {node}
    </>
  );
}

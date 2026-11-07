import { useId, useRef, useState } from "react";
import { fileToResizedDataUrl } from "@/admin/image";
import { ImageIcon, TrashIcon } from "@/components/icons";
import { cx } from "@/lib/cx";
import { assetUrl } from "@/lib/asset";

/** Seletor de fotos em 4:5 (formato do feed do Instagram), com reordenação simples. */
export function ImagePicker({
  value,
  onChange,
  max = 10,
  labels,
  aspect = "aspect-[4/5]",
  resize,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  /** Nomes por posição; sem isso: "Capa", "Foto 2", "Foto 3"… */
  labels?: string[];
  aspect?: string;
  resize?: { maxW: number; maxH: number; type?: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const name = (i: number) => labels?.[i] ?? (i === 0 ? "Capa" : `Foto ${i + 1}`);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setBusy(true);
    try {
      const room = max - value.length;
      const picked = Array.from(files).slice(0, room);
      const urls = await Promise.all(picked.map((f) => fileToResizedDataUrl(f, resize)));
      onChange([...value, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={cx("grid gap-3", max === 1 ? "grid-cols-1 max-w-[180px]" : "grid-cols-3 sm:grid-cols-4")}>
        {value.map((src, i) => (
          <figure key={i} className="flex flex-col gap-1.5">
            <div className={cx("relative overflow-hidden rounded-card border border-line bg-ph-a", aspect)}>
              <img src={assetUrl(src)} alt={name(i)} className="absolute inset-0 size-full object-cover" />
              <button
                type="button"
                aria-label={`Remover ${name(i)}`}
                onClick={() => onChange(value.filter((_, k) => k !== i))}
                className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-white text-charcoal hover:bg-error hover:text-white"
              >
                <TrashIcon size={16} />
              </button>
            </div>
            <figcaption className="flex items-center justify-between text-[12px] text-muted">
              {name(i)}
              {value.length > 1 && (
                <span className="flex gap-1">
                  <button type="button" aria-label="Mover para a esquerda" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 disabled:opacity-30">
                    ←
                  </button>
                  <button type="button" aria-label="Mover para a direita" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="px-1 disabled:opacity-30">
                    →
                  </button>
                </span>
              )}
            </figcaption>
          </figure>
        ))}
        {value.length < max && (
          <label
            htmlFor={id}
            className={cx(
              "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-[#CFCCC8] bg-alabaster p-2 text-center text-[12px] text-muted hover:border-charcoal",
              aspect,
            )}
          >
            <ImageIcon size={22} />
            {busy ? "Carregando…" : value.length ? "Adicionar foto" : "Adicionar capa"}
          </label>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        className="sr-only"
        onChange={(e) => add(e.target.files)}
      />
      {error && <p className="text-[12px] font-medium text-error">{error}</p>}
    </div>
  );
}

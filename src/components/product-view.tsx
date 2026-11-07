import { useEffect, useRef, useState } from "react";
import {
  discountPercent,
  freeDeliveryThreshold,
  SIZES,
  type Product,
  type Size,
} from "@/data/catalog";
import {
  BackIcon,
  BagIcon,
  CheckIcon,
  ExchangeIcon,
  HeartIcon,
  TruckIcon,
} from "@/components/icons";
import { cx } from "@/lib/cx";
import { BagButton, Eyebrow, IconButton, PrimaryButton, ProductPhoto } from "@/components/ui";
import { openBag } from "@/lib/bag-drawer";
import { useCategories, useSettings } from "@/lib/db";
import { brl } from "@/lib/format";
import { useGoBack } from "@/lib/navigation";
import { actions, useStore } from "@/lib/store";

/** Sem fotos, o carrossel mostra 3 placeholders. */
const PLACEHOLDER_SLIDES = ["frente", "costas", "detalhe"];
const TOAST_MS = 2600;

export function ProductView({
  product: p,
  ctaLabel = "Adicionar à Sacola",
}: {
  product: Product;
  /** Alternativa prevista no design: "Comprar Agora". */
  ctaLabel?: "Adicionar à Sacola" | "Comprar Agora";
}) {
  const goBack = useGoBack();
  const { wish, bag } = useStore();
  const wished = !!wish[p.id];
  const settings = useSettings();
  const category = useCategories().find((c) => c.id === p.categoryId)?.name ?? "";
  const { pix, card } = settings.payments;
  const freeAbove = freeDeliveryThreshold(settings);
  const onSale = discountPercent(p) > 0;

  const [slide, setSlide] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [sizeErr, setSizeErr] = useState(false);
  const [stockErr, setStockErr] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const slides = p.images.length
    ? p.images.map((src, i) => ({ key: src, src, alt: `${p.name} — foto ${i + 1} de ${p.images.length}`, label: "" }))
    : PLACEHOLDER_SLIDES.map((name) => ({
        key: name,
        src: undefined,
        alt: `${p.name} — ${name}`,
        label: `${p.photoLabel} · ${name}`,
      }));
  const stock = size ? p.stock[size] : null;
  const inBag = size ? (bag.find((b) => b.pid === p.id && b.size === size)?.qty ?? 0) : 0;
  const stockNote =
    stock && inBag >= stock
      ? `Todas as peças deste tamanho já estão na sua sacola.`
      : stock === 1
        ? "Última peça neste tamanho."
        : stock
          ? `${stock} peças disponíveis.`
          : "Tamanhos riscados estão esgotados.";
  const pixPrice = p.price * (1 - pix.discountPercent / 100);
  const installments = Math.max(1, card.installments);

  function addToBag() {
    if (!size) {
      setSizeErr(true);
      return;
    }
    if (!actions.addToBag(p.id, size)) {
      setStockErr(true);
      setToast("");
      return;
    }
    setToast(`Tamanho ${size} adicionado`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-white">
      {/* Carrossel */}
      <div className="relative h-[420px] overflow-hidden rounded-b-[32px] bg-ph-a">
        <div
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== slide) setSlide(i);
          }}
          aria-label={`Fotos de ${p.name}`}
          role="region"
        >
          {slides.map((s, i) => (
            <ProductPhoto
              key={s.key}
              src={s.src}
              alt={s.alt}
              label={s.label}
              stripe={10}
              priority={i === 0}
              className="h-full flex-[0_0_100%] snap-start"
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between">
          <IconButton tone="white" aria-label="Voltar" onClick={goBack} className="pointer-events-auto">
            <BackIcon size={22} />
          </IconButton>
          <div className="pointer-events-auto flex gap-2">
            <IconButton
              tone="white"
              aria-label={wished ? "Remover dos favoritos" : "Favoritar"}
              aria-pressed={wished}
              onClick={() => actions.toggleWish(p.id)}
            >
              <HeartIcon size={22} filled={wished} />
            </IconButton>
            <BagButton tone="white" iconSize={22} />
          </div>
        </div>

        {/* Fundo claro atrás dos pontos: legíveis sobre qualquer foto. */}
        <div
          className="pointer-events-none absolute bottom-3.5 left-1/2 flex -translate-x-1/2 justify-center gap-1.5 rounded-full bg-white/75 px-2 py-1.5"
          aria-hidden="true"
        >
          {slides.map((s, i) => (
            <span
              key={s.key}
              className={cx(
                "h-1.5 rounded-full transition-[width] duration-200",
                i === slide ? "w-[18px] bg-charcoal" : "w-1.5 bg-[rgba(44,44,44,.28)]",
              )}
            />
          ))}
        </div>
      </div>

      {/* Informações */}
      <main className="flex flex-col gap-5 px-5 pt-5 pb-[calc(140px+env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          {category && <Eyebrow>{category}</Eyebrow>}
          <h1 className="font-display text-[30px] leading-9 font-bold tracking-[-.02em] text-pretty">
            {p.name}
          </h1>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-[24px] font-bold">{brl(p.price)}</span>
            {onSale && p.oldPrice && (
              <span className="text-[15px] text-strike line-through">
                <span className="sr-only">de </span>
                {brl(p.oldPrice)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 text-[14px] leading-5 text-body-2">
            {card.enabled && installments > 1 && (
              <span>
                ou {installments}x de {brl(p.price / installments)} sem juros
              </span>
            )}
            {pix.enabled && pix.discountPercent > 0 && (
              <span>
                <span className="font-semibold text-copper-ink">{brl(pixPrice)}</span> no Pix
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-semibold">
              Tamanho
              {size && <span className="font-normal text-muted"> · {size}</span>}
            </span>
            {/* TODO: link "Guia de medidas" volta quando a loja enviar a tabela (link sem destino confunde). */}
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Tamanho">
            {SIZES.map((z) => {
              const out = !p.stock[z];
              const sel = size === z;
              return (
                <button
                  key={z}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  disabled={out}
                  aria-label={out ? `${z} esgotado` : `Tamanho ${z}`}
                  onClick={() => {
                    setSize(z);
                    setSizeErr(false);
                    setStockErr(false);
                  }}
                  className={cx(
                    "relative h-12 w-14 overflow-hidden rounded-field border text-[15px] font-medium",
                    sel
                      ? "border-charcoal bg-charcoal text-white"
                      : out
                        ? "border-line bg-out-bg text-out-fg"
                        : "border-line bg-white text-charcoal",
                  )}
                >
                  {z}
                  {out && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 -right-2.5 -left-2.5 h-px -rotate-40 bg-out-line"
                    />
                  )}
                </button>
              );
            })}
          </div>
          {sizeErr && (
            <span role="alert" className="text-[13px] font-medium text-error">
              Escolha um tamanho para continuar.
            </span>
          )}
          {stockErr && (
            <span role="alert" className="text-[13px] font-medium text-error">
              Todas as peças do tamanho {size} já estão na sua sacola.
            </span>
          )}
          {!stockErr && (
            <span className="text-[13px] text-muted" aria-live="polite">
              {stockNote}
            </span>
          )}
        </div>

        <section className="flex flex-col gap-2 border-t border-line pt-[18px]">
          <h2 className="text-[14px] font-semibold">Descrição</h2>
          <p className="text-[15px] leading-[23px] text-pretty text-body-2">
            {descOpen ? `${p.description} ${p.descriptionMore}` : p.description}
          </p>
          {p.descriptionMore && (
          <button
            type="button"
            aria-expanded={descOpen}
            onClick={() => setDescOpen((o) => !o)}
            className="self-start py-1.5 text-[14px] font-semibold text-charcoal underline underline-offset-[3px]"
          >
            {descOpen ? "Ler menos" : "Ler mais"}
          </button>
          )}
        </section>

        <ul className="flex flex-col border-t border-line">
          {freeAbove !== null && (
            <li className="flex items-center gap-3 border-b border-line py-3.5">
              <TruckIcon size={22} className="flex-none" />
              <span className="text-[14px] leading-5">
                Entrega grátis em {settings.shipping.localCityLabel.split(" — ")[0]} acima de {brl(freeAbove)}
              </span>
            </li>
          )}
          <li className="flex items-center gap-3 border-b border-line py-3.5">
            <ExchangeIcon size={22} className="flex-none" />
            <span className="text-[14px] leading-5">Primeira troca grátis em até 7 dias</span>
          </li>
        </ul>
      </main>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[calc(90px+env(safe-area-inset-bottom))] z-10 mx-auto max-w-[480px] px-4"
        >
          <div className="flex items-center gap-2.5 rounded-card bg-charcoal px-4 py-3.5 text-[14px] font-medium text-white">
            <CheckIcon size={18} />
            <span className="flex-1">{toast}</span>
            <button
              type="button"
              onClick={openBag}
              className="font-semibold underline underline-offset-[3px]"
            >
              Ver sacola
            </button>
          </div>
        </div>
      )}

      {/* Barra de ação fixa */}
      <div className="pb-safe-bar fixed inset-x-0 bottom-0 z-[9] mx-auto max-w-[480px] border-t border-line bg-white px-4 pt-3">
        <PrimaryButton type="button" onClick={addToBag}>
          <BagIcon size={20} />
          {ctaLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  discountPercent,
  filterShelf,
  storeShelves,
  type Category,
  type Product,
  type ShelfKey,
} from "@/data/catalog";
import { HeroBanner } from "@/components/hero-banner";
import { HeartIcon } from "@/components/icons";
import { BagButton, Eyebrow, ProductPhoto } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useCategories, useHero, useProducts, useSettings } from "@/lib/db";
import { brl, whatsappUrl } from "@/lib/format";
import { actions, useStore } from "@/lib/store";
import { assetUrl } from "@/lib/asset";

export function Storefront() {
  const products = useProducts();
  const categories = useCategories();
  const hero = useHero();
  const settings = useSettings();

  const shelves = useMemo(() => storeShelves(categories, products), [categories, products]);
  const [shelf, setShelf] = useState<ShelfKey>("novidades");
  // Se a categoria escolhida sumir (desativada no admin), volta para Novidades.
  const current = shelves.find((s) => s.key === shelf) ?? shelves[0];
  const list = useMemo(() => filterShelf(products, current.key), [products, current.key]);

  const catalogRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLElement>(null);

  // Mantém a categoria ativa visível na barra de categorias (ex.: ao vir do banner).
  useEffect(() => {
    const nav = pillsRef.current;
    const pill = nav?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (!nav || !pill) return;
    const left = pill.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + pill.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: left - 16, behavior: "smooth" });
    }
  }, [current.key]);

  function openHeroShelf() {
    if (shelves.some((s) => s.key === hero.target)) setShelf(hero.target);
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const instagram = settings.instagram.replace(/^@/, "");

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-alabaster">
      <header className="sticky top-0 z-[5] border-b border-line bg-white">
        <div className="flex h-[60px] items-center justify-between pr-1 pl-3">
          <h1 className="min-w-0">
            <Link to="/" className="flex items-center gap-2 rounded-full pr-2">
              <img
                src={assetUrl(settings.logo)}
                alt=""
                width={46}
                height={46}
                fetchPriority="high"
                className="size-[46px] flex-none object-cover mix-blend-multiply brightness-[1.05] contrast-[1.15]"
              />
              <span className="truncate font-display text-[19px] leading-6 font-bold tracking-[-.02em]">
                {settings.name}
              </span>
            </Link>
          </h1>
          <BagButton />
        </div>
        <nav ref={pillsRef} aria-label="Categorias" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-1 pb-3">
          {shelves.map((s) => {
            const active = s.key === current.key;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={active}
                onClick={() => setShelf(s.key)}
                className={cx(
                  "h-9 flex-none rounded-full border px-4 text-[14px] font-medium whitespace-nowrap",
                  active
                    ? "border-copper bg-copper text-white"
                    : "border-chip bg-chip text-charcoal hover:border-charcoal",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main>
        {hero.enabled && <HeroBanner hero={hero} onCta={openHeroShelf} />}

        {/* scroll-mt: compensa o header fixo (logo + categorias) ao rolar até aqui. */}
        <div
          ref={catalogRef}
          className="flex scroll-mt-[113px] items-baseline justify-between px-4 pt-5 pb-3.5"
        >
          <h2 className="font-display text-[24px] leading-[30px] font-bold tracking-[-.02em]">
            {current.label}
          </h2>
          <span className="text-[13px] text-muted">
            {list.length} {list.length === 1 ? "peça" : "peças"}
          </span>
        </div>

        {list.length ? (
          <ul className="grid grid-cols-2 gap-2.5 px-3.5">
            {list.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} categories={categories} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-[14px] text-muted">
            Nenhuma peça nesta categoria por enquanto.
          </p>
        )}
      </main>

      <footer className="flex flex-col items-center gap-3 px-6 pt-8 pb-10 text-center">
        <p className="text-[13px] leading-[1.5] text-pretty text-muted">{settings.description}</p>
        {(settings.phone || instagram) && (
          <div className="flex flex-wrap justify-center gap-2">
            {settings.phone && (
              <a
                href={whatsappUrl(settings.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center rounded-full border border-line bg-white px-4 text-[14px] font-medium text-charcoal hover:border-charcoal"
              >
                WhatsApp
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center rounded-full border border-line bg-white px-4 text-[14px] font-medium text-charcoal hover:border-charcoal"
              >
                @{instagram}
              </a>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}

function ProductCard({
  product: p,
  categories,
  priority,
}: {
  product: Product;
  categories: Category[];
  priority: boolean;
}) {
  const { wish } = useStore();
  const wished = !!wish[p.id];
  const off = discountPercent(p);
  const category = categories.find((c) => c.id === p.categoryId)?.name ?? "";

  return (
    // O card inteiro é o link; o coração fica por cima, fora do link, para não abrir o produto.
    <div className="relative flex h-full flex-col rounded-tile bg-white p-1.5">
      <Link to={`/produto/${p.slug}`} className="flex flex-1 flex-col rounded-tile">
        <ProductPhoto
          src={p.images[0]}
          alt={p.name}
          label={p.photoLabel}
          priority={priority}
          className="aspect-[4/5] rounded-card"
        >
          {off > 0 && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-copper px-1.5 py-[5px] text-[11px] leading-none font-semibold text-white">
              −{off}%
            </span>
          )}
        </ProductPhoto>
        <div className="flex flex-col gap-1 px-2 py-2.5">
          {category && <Eyebrow className="text-[10px] leading-[14px]">{category}</Eyebrow>}
          <span className="font-display text-[16px] leading-[21px] font-semibold text-pretty">
            {p.name}
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold">{brl(p.price)}</span>
            {off > 0 && p.oldPrice && (
              <span className="text-[12px] text-strike line-through">
                <span className="sr-only">de </span>
                {brl(p.oldPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => actions.toggleWish(p.id)}
        aria-label={wished ? `Remover ${p.name} dos favoritos` : `Favoritar ${p.name}`}
        aria-pressed={wished}
        className="absolute top-3.5 right-3.5 flex size-9 items-center justify-center rounded-full bg-white text-charcoal"
      >
        <HeartIcon size={20} filled={wished} />
      </button>
    </div>
  );
}

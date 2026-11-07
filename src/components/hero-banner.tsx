import type { Hero } from "@/data/catalog";
import { assetUrl } from "@/lib/asset";

/** Altura fixa do banner em qualquer tela. */
const HERO_HEIGHT = 200;
/** Respiro interno do card (mesmo dos cards de produto). */
const INSET = 6;
/** Foto no formato do feed do Instagram: 4:5 (1080×1350). Largura sai da altura. */
const PHOTO_H = HERO_HEIGHT - INSET * 2;
const PHOTO_W = (PHOTO_H * 4) / 5;

/**
 * Banner da home: card cobre (raio 22, sem sombra), altura fixa, foto 4:5 à direita.
 * Texto branco sobre cobre só em tamanhos grandes/seminegrito (regra de contraste do manual).
 * Altura fixa = espaço para selo + título (até 3 linhas) + botão; o tamanho do título
 * acompanha a largura da coluna (container queries).
 */
export function HeroBanner({
  hero,
  onCta,
  className = "mx-4 mt-4",
}: {
  hero: Hero;
  onCta?: () => void;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="hero-title"
      className={`grid rounded-tile bg-copper ${className}`}
      style={{
        height: HERO_HEIGHT,
        padding: INSET,
        gridTemplateColumns: `minmax(0,1fr) ${PHOTO_W}px`,
      }}
    >
      <div className="@container flex min-w-0 flex-col items-start gap-2 overflow-hidden py-3 pr-2.5 pl-3">
        {hero.tag && (
          <span className="flex-none rounded-full bg-white px-2.5 py-1 text-[11px] leading-none font-semibold tracking-[.06em] whitespace-nowrap text-copper-ink uppercase">
            {hero.tag}
          </span>
        )}
        <h2
          id="hero-title"
          className="line-clamp-3 flex-none font-display text-[18px] leading-[22px] font-bold tracking-[-.02em] text-pretty text-white @min-[170px]:text-[20px] @min-[170px]:leading-6 @min-[240px]:text-[22px] @min-[240px]:leading-[26px]"
        >
          {hero.title}
        </h2>
        <button
          type="button"
          onClick={onCta}
          className={
            // Telas muito estreitas (~320px): o rótulo pode quebrar em 2 linhas em vez de vazar.
            "mt-auto min-h-10 max-w-full flex-none rounded-full bg-white px-3.5 py-2 text-center text-[14px] leading-[17px] font-semibold text-charcoal hover:bg-charcoal hover:text-white " +
            "@min-[150px]:px-4 @min-[150px]:text-[15px] @min-[150px]:whitespace-nowrap"
          }
        >
          {hero.cta}
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-card"
        style={{
          width: PHOTO_W,
          height: PHOTO_H,
          background: hero.image
            ? undefined
            : "repeating-linear-gradient(135deg, rgba(255,255,255,.22) 0 8px, rgba(255,255,255,.12) 8px 16px)",
        }}
      >
        {hero.image ? (
          <img
            src={assetUrl(hero.image)}
            alt={hero.imageAlt}
            width={1080}
            height={1350}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span
            role="img"
            aria-label={hero.imageAlt}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center font-mono text-[10px] leading-[1.4] tracking-[.06em] text-white uppercase"
          >
            <span>foto · campanha</span>
            <span className="opacity-80">4:5 · 1080×1350</span>
          </span>
        )}
      </div>
    </section>
  );
}

import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { BagIcon } from "@/components/icons";
import { openBag } from "@/lib/bag-drawer";
import { cx } from "@/lib/cx";
import { useBagCount } from "@/lib/store";
import { assetUrl } from "@/lib/asset";


/** Botão primário cobre: pílula, 52–54px, largura total. */
export function PrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        "flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-copper text-[16px] font-semibold text-white",
        "hover:bg-copper-hover active:bg-copper-active",
        "disabled:bg-disabled-bg disabled:text-disabled-fg",
        className,
      )}
    />
  );
}

/** Botão secundário: contorno carvão, vira sólido no hover. */
export function SecondaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        "h-[52px] w-full rounded-full border border-charcoal bg-transparent text-[16px] font-medium text-charcoal",
        "hover:bg-charcoal hover:text-white",
        className,
      )}
    />
  );
}

/** Botão circular de 44px (header). */
export function IconButton({
  className,
  tone = "muted",
  ...props
}: ComponentProps<"button"> & { tone?: "muted" | "white" }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "relative flex size-11 items-center justify-center rounded-full text-charcoal",
        tone === "muted" ? "bg-icon-btn" : "bg-white",
        className,
      )}
    />
  );
}

/** Botão da sacola com badge de quantidade: abre a gaveta lateral. */
export function BagButton({
  tone = "muted",
  iconSize = 24,
}: {
  tone?: "muted" | "white";
  iconSize?: number;
}) {
  const count = useBagCount();
  const overlay = tone === "white";
  return (
    <button
      type="button"
      onClick={openBag}
      aria-haspopup="dialog"
      aria-label={count ? `Sacola, ${count} ${count === 1 ? "item" : "itens"}` : "Sacola"}
      className={cx(
        "relative flex size-11 items-center justify-center rounded-full text-charcoal",
        overlay ? "bg-white" : "bg-icon-btn",
      )}
    >
      <BagIcon size={iconSize} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className={cx(
            "absolute box-border rounded-full bg-copper px-1 text-center text-[10px] font-semibold text-white",
            overlay
              ? "top-[5px] right-1 h-4 min-w-4 leading-4"
              : "-top-0.5 -right-[3px] h-[17px] min-w-[17px] leading-[17px]",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Seletor de quantidade (− 1 +). Quantidade 0 remove o item. */
export function QtyStepper({
  qty,
  label,
  onDec,
  onInc,
}: {
  qty: number;
  label: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex h-9 items-center rounded-card border border-line">
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${label}`}
        onClick={onDec}
        className="size-[34px] text-[18px] text-charcoal"
      >
        −
      </button>
      <span className="min-w-[18px] text-center text-[14px] font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${label}`}
        onClick={onInc}
        className="size-[34px] text-[18px] text-charcoal"
      >
        +
      </button>
    </div>
  );
}

/**
 * Foto de produto 4:5. Sem foto real, mostra o placeholder listrado do protótipo.
 */
export function ProductPhoto({
  src,
  alt,
  label,
  stripe = 8,
  priority,
  className,
  children,
}: {
  src?: string;
  alt: string;
  label?: string;
  stripe?: number;
  priority?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={
        src
          ? { background: "var(--color-ph-a)" }
          : {
              background: `repeating-linear-gradient(135deg, var(--color-ph-a) 0 ${stripe}px, var(--color-ph-b) ${stripe}px ${stripe * 2}px)`,
            }
      }
    >
      {src ? (
        <img
          src={assetUrl(src)}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          // Corte puxado para cima: fotos de moda em 3:4 perdem menos o rosto da modelo.
          className="absolute inset-0 size-full object-cover object-[50%_30%]"
        />
      ) : (
        label && (
          <span
            role="img"
            aria-label={alt}
            className="absolute inset-0 flex items-center justify-center p-3 text-center font-mono text-[10px] leading-[1.4] tracking-[.06em] text-[#6F655C] uppercase"
          >
            {label}
          </span>
        )
      )}
      {children}
    </div>
  );
}

/** Legenda maiúscula (categoria). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "font-medium tracking-[.1em] text-muted uppercase",
        className ?? "text-[11px] leading-[14px]",
      )}
    >
      {children}
    </span>
  );
}

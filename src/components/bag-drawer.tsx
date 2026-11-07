import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { freeDeliveryThreshold } from "@/data/catalog";
import { BagIcon, CloseIcon } from "@/components/icons";
import {
  IconButton,
  PrimaryButton,
  ProductPhoto,
  QtyStepper,
  SecondaryButton,
} from "@/components/ui";
import { closeBag, useBagDrawerOpen } from "@/lib/bag-drawer";
import { useSettings } from "@/lib/db";
import { cx } from "@/lib/cx";
import { brl } from "@/lib/format";
import { actions, useBagLines } from "@/lib/store";

/** Sacola em gaveta lateral: entra da direita, com resumo e botão para o checkout. */
export function BagDrawer() {
  const open = useBagDrawerOpen();
  const { lines, count, subtotal } = useBagLines();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Ao abrir: foco no fechar, Esc fecha, página de trás não rola. Ao fechar: foco volta.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBag();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  const settings = useSettings();
  const { pix } = settings.payments;
  const pixTotal = subtotal * (1 - pix.discountPercent / 100);
  const threshold = freeDeliveryThreshold(settings);
  const missing = threshold === null ? 0 : Math.max(0, threshold - subtotal);
  const city = settings.shipping.localCityLabel.split(" — ")[0];

  function goTo(path: string) {
    closeBag();
    if (path !== pathname) navigate(path);
  }

  return (
    <div
      className={cx(
        "fixed inset-0 z-30 mx-auto max-w-[480px] overflow-hidden",
        // Abre na hora (para o foco funcionar); ao fechar, só some depois da animação.
        open ? "visible" : "invisible transition-[visibility] duration-300",
      )}
    >
      <div
        aria-hidden="true"
        onClick={closeBag}
        className={cx(
          "absolute inset-0 bg-charcoal/40 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        className={cx(
          "absolute inset-y-0 right-0 flex w-[min(88%,400px)] flex-col overflow-hidden rounded-l-[24px] bg-alabaster",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex h-[60px] flex-none items-center justify-between border-b border-line bg-white pr-2 pl-4">
          <h2 id="bag-title" className="font-display text-[19px] font-semibold">
            Sua sacola
            {count > 0 && (
              <span className="font-sans text-[14px] font-normal text-muted">
                {" "}
                · {count} {count === 1 ? "item" : "itens"}
              </span>
            )}
          </h2>
          <IconButton ref={closeRef} aria-label="Fechar sacola" onClick={closeBag}>
            <CloseIcon size={22} />
          </IconButton>
        </header>

        {lines.length ? (
          <>
            <ul className="flex flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-3">
              {lines.map((l) => (
                <li
                  key={`${l.pid}-${l.size}`}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-card border border-line bg-white p-2.5"
                >
                  <Link
                    to={`/produto/${l.product.slug}`}
                    onClick={closeBag}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <ProductPhoto
                      src={l.product.images[0]}
                      alt=""
                      stripe={5}
                      className="h-20 w-16 rounded-thumb"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      to={`/produto/${l.product.slug}`}
                      onClick={closeBag}
                      className="font-display text-[15px] leading-[19px] font-semibold"
                    >
                      {l.product.name}
                    </Link>
                    <span className="text-[12px] text-muted">Tamanho {l.size}</span>
                    {l.qty > l.stock && (
                      <span className="text-[12px] font-medium text-error">
                        {l.stock ? `Só ${l.stock} em estoque: diminua a quantidade` : "Esgotou: remova da sacola"}
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
                      <span className="text-[15px] font-bold">{brl(l.product.price * l.qty)}</span>
                      <QtyStepper
                        qty={l.qty}
                        max={l.stock}
                        label={l.product.name}
                        onDec={() => actions.changeQty(l.index, -1)}
                        onInc={() => actions.changeQty(l.index, 1)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="pb-safe-bar flex flex-none flex-col gap-3 border-t border-line bg-white px-4 pt-3.5">
              {threshold !== null && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-body-2">
                  {missing > 0 ? (
                    <>
                      Faltam <strong className="font-semibold text-charcoal">{brl(missing)}</strong> para
                      entrega grátis em {city}
                    </>
                  ) : (
                    `Entrega grátis em ${city} garantida`
                  )}
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-chip" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-copper"
                    style={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }}
                  />
                </div>
              </div>
              )}

              <div className="flex items-baseline justify-between">
                <span className="text-[14px] text-body-2">Subtotal</span>
                <span className="text-[20px] font-bold">{brl(subtotal)}</span>
              </div>
              {pix.enabled && pix.discountPercent > 0 && (
                <span className="-mt-2.5 self-end text-[13px] font-semibold text-copper-ink">
                  ou {brl(pixTotal)} no Pix
                </span>
              )}

              <PrimaryButton type="button" onClick={() => goTo("/checkout")}>
                Finalizar pedido
              </PrimaryButton>
              <button
                type="button"
                onClick={closeBag}
                className="-mt-1 h-10 text-[14px] font-semibold text-charcoal underline underline-offset-[3px]"
              >
                Continuar comprando
              </button>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-7 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-icon-btn">
              <BagIcon size={28} />
            </span>
            <p className="font-display text-[18px] leading-[22px] font-semibold">Sua sacola está vazia</p>
            <p className="text-[14px] leading-5 text-muted">
              Escolha suas peças favoritas e elas aparecem aqui.
            </p>
            <SecondaryButton type="button" className="mt-2" onClick={() => goTo("/")}>
              Ver a vitrine
            </SecondaryButton>
          </div>
        )}
      </aside>
    </div>
  );
}

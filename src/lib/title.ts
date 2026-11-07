import { useEffect } from "react";

const DEFAULT_TITLE = "Você Fashion · Moda feminina em Bom Jesus da Lapa";

/** Define o título da aba; sem argumento, usa o título padrão da loja. */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Você Fashion` : DEFAULT_TITLE;
  }, [title]);
}

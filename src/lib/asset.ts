/**
 * Pasta onde o site está publicado: "/" na raiz do domínio ou, por exemplo,
 * "/voce-fashion/" numa subpasta. Vem do `base` do Vite (ver vite.config.ts).
 */
export const BASE = import.meta.env.BASE_URL;

/** Base para o React Router ("/voce-fashion"), sem a barra final. */
export const ROUTER_BASENAME = BASE.replace(/\/$/, "") || "/";

/**
 * Endereço de um arquivo da pasta public/ ("/produtos/x/01.webp") já com a pasta do site.
 * Fotos enviadas pelo painel (data:) e links externos passam direto.
 */
export function assetUrl(src: string) {
  if (!src || /^(data:|blob:|https?:)/.test(src)) return src;
  return src.startsWith("/") ? BASE + src.slice(1) : src;
}

/** Link de página para abrir fora do roteador (nova aba): "/produto/x" → "/voce-fashion/produto/x". */
export function pageUrl(path: string) {
  return BASE + path.replace(/^\//, "");
}

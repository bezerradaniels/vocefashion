import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, runnerImport, type Plugin, type ResolvedConfig } from "vite";

/**
 * Prévia de links (WhatsApp, Instagram, Facebook) e Google.
 *
 * O site é uma SPA: sem isto, todo link compartilhado mostra a mesma página vazia, sem foto.
 * - Home: troca o bloco <!-- seo --> do index.html por título, descrição e tags Open Graph.
 * - Produtos: no build, gera produto/<slug>.html (cópia do index.html com as tags da peça e
 *   dados estruturados de Product). O .htaccess serve esse arquivo em /produto/<slug>.
 *
 * As tags vêm do catálogo inicial (src/data/catalog.ts). O que for mudado só no painel
 * (localStorage) não entra aqui; com o Supabase, gerar a partir do banco.
 *
 * Endereço do site: VITE_SITE_URL (só o domínio, sem a pasta), em .env.production / .env.mintcode.
 */

type Meta = {
  title: string;
  description: string;
  path: string;
  image: string;
  imageAlt: string;
  type: "website" | "product";
  extra?: string;
};

// Só o que o plugin lê do catálogo (sem puxar os tipos da loja para o tsconfig do Node).
type CatalogModule = {
  SEED_PRODUCTS: {
    slug: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    active: boolean;
    stock: Record<string, number>;
  }[];
  SEED_SETTINGS: { name: string };
};

const START = "<!-- seo -->";
const END = "<!-- /seo -->";

const HOME = {
  title: "Você Fashion · Moda feminina em Bom Jesus da Lapa",
  description:
    "Moda feminina com entrega no mesmo dia em Bom Jesus da Lapa (BA). Vestidos, blusas e calças. Pague com Pix e ganhe 5% de desconto.",
  image: "/og-home.jpg",
  imageAlt: "Modelo com vestido longo listrado azul e off-white",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function clip(s: string, max = 155) {
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max - 1)).replace(/[\s,.;:]+$/, "") + "…";
}

export function seo(): Plugin {
  let config: ResolvedConfig;
  let site = "";

  /** "/produto/x" → "https://dominio/pasta/produto/x" (vazio sem VITE_SITE_URL). */
  const abs = (path: string) => (site ? site + config.base + path.replace(/^\//, "") : "");

  function tags(m: Meta) {
    const url = abs(m.path);
    const image = abs(m.image);
    return [
      START,
      `<title>${esc(m.title)}</title>`,
      `<meta name="description" content="${esc(m.description)}" />`,
      url && `<link rel="canonical" href="${url}" />`,
      `<meta property="og:site_name" content="Você Fashion" />`,
      `<meta property="og:locale" content="pt_BR" />`,
      `<meta property="og:type" content="${m.type}" />`,
      `<meta property="og:title" content="${esc(m.title)}" />`,
      `<meta property="og:description" content="${esc(m.description)}" />`,
      url && `<meta property="og:url" content="${url}" />`,
      image && `<meta property="og:image" content="${image}" />`,
      image && `<meta property="og:image:alt" content="${esc(m.imageAlt)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      m.extra,
      END,
    ]
      .filter(Boolean)
      .join("\n    ");
  }

  const replaceBlock = (html: string, m: Meta) => {
    const a = html.indexOf(START);
    const b = html.indexOf(END);
    if (a < 0 || b < 0) throw new Error(`[seo] index.html precisa do bloco ${START} … ${END}`);
    return html.slice(0, a) + tags(m) + html.slice(b + END.length);
  };

  return {
    name: "seo",
    enforce: "post",
    configResolved(c) {
      config = c;
      site = (loadEnv(c.mode, c.root, "VITE_").VITE_SITE_URL ?? "").replace(/\/+$/, "");
      if (c.command === "build" && !site)
        c.logger.warn("[seo] VITE_SITE_URL não definido: links compartilhados ficarão sem foto.");
    },
    transformIndexHtml(html) {
      return replaceBlock(html, { ...HOME, path: "/", type: "website" });
    },
    async generateBundle(_, bundle) {
      const index = bundle["index.html"];
      if (!index || index.type !== "asset") return;
      const html = String(index.source);

      const { module: catalog } = await runnerImport<CatalogModule>("/src/data/catalog.ts", {
        root: config.root,
        configFile: false,
        resolve: { alias: config.resolve.alias },
        logLevel: "error",
      });

      for (const p of catalog.SEED_PRODUCTS) {
        if (!p.active) continue;
        const dir = `/produtos/${p.slug}`;
        const share = existsSync(join(config.publicDir, dir, "og.jpg")) ? `${dir}/og.jpg` : p.images[0];
        const price = p.price.toFixed(2);
        const inStock = Object.values(p.stock).some((n) => n > 0);
        const priceBRL = `R$ ${price.replace(".", ",")}`;
        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: p.images.map(abs).filter(Boolean),
          brand: { "@type": "Brand", name: catalog.SEED_SETTINGS.name },
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price,
            availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
            url: abs(`/produto/${p.slug}`) || undefined,
          },
        };
        const extra = [
          `<meta property="product:price:amount" content="${price}" />`,
          `<meta property="product:price:currency" content="BRL" />`,
          `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
        ].join("\n    ");

        this.emitFile({
          type: "asset",
          fileName: `produto/${p.slug}.html`,
          source: replaceBlock(html, {
            title: `${p.name} · ${priceBRL} · Você Fashion`,
            description: clip(p.description),
            path: `/produto/${p.slug}`,
            image: share,
            imageAlt: p.name,
            type: "product",
            extra,
          }),
        });
      }
    },
  };
}

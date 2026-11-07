import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

/**
 * Gera o .htaccess (Apache/LiteSpeed, ex.: Hostinger) para a pasta do build:
 * qualquer rota que não seja arquivo (/produto/x, /checkout, /admin) abre o index.html.
 */
function spaHtaccess(): Plugin {
  let base = "/";
  return {
    name: "spa-htaccess",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: ".htaccess",
        source: [
          "# Gerado no build (vite.config.ts). SPA: rotas sem arquivo abrem o index.html.",
          "<IfModule mod_rewrite.c>",
          "  RewriteEngine On",
          `  RewriteBase ${base}`,
          "  RewriteRule ^index\\.html$ - [L]",
          "  RewriteCond %{REQUEST_FILENAME} !-f",
          "  RewriteCond %{REQUEST_FILENAME} !-d",
          `  RewriteRule . ${base}index.html [L]`,
          "</IfModule>",
          "",
        ].join("\n"),
      });
    },
  };
}

// https://vite.dev/config/
// Pasta de publicação: "/" (raiz do domínio) por padrão.
// Para uma subpasta: `vite build --base=/voce-fashion/` (ver script build:mintcode).
export default defineConfig({
  plugins: [react(), tailwindcss(), spaHtaccess()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});

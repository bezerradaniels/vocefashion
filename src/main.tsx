import "./fonts.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Root } from "@/routes/root";
import { HomePage } from "@/routes/home";
import { ProductPage } from "@/routes/product";
import { CheckoutPage } from "@/routes/checkout";
import { NotFoundPage } from "@/routes/not-found";
import { pageUrl, ROUTER_BASENAME } from "@/lib/asset";

// Link de recuperação de senha que caiu em outra página da loja (ex.: Site URL do Supabase na raiz):
// leva para a tela de nova senha mantendo o token (#access_token=…&type=recovery).
{
  const { hash, pathname } = window.location;
  const recovery = pageUrl("/admin/nova-senha");
  if (/[#&](type=recovery|error_code=)/.test(hash) && !pathname.startsWith(recovery)) {
    window.location.replace(recovery + hash);
  }
}

const router = createBrowserRouter(
  [
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "produto/:slug", Component: ProductPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
  {
    // Painel: carregado só quando alguém abre /admin (não pesa na loja).
    path: "/admin/*",
    lazy: async () => ({ Component: (await import("@/admin/app")).AdminApp }),
  },
  ],
  // Funciona na raiz do domínio ou numa subpasta (ex.: /voce-fashion/).
  { basename: ROUTER_BASENAME },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

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
import { ROUTER_BASENAME } from "@/lib/asset";

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

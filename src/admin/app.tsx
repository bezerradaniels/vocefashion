import type { ReactNode } from "react";
import { Navigate, Route, Routes, ScrollRestoration, useLocation } from "react-router";
import { useAdminSession } from "@/admin/auth";
import { LoadingScreen } from "@/components/loading-screen";
import { useDbStatus } from "@/lib/db";
import { AdminLayout } from "@/admin/layout";
import { CategoriesPage } from "@/admin/pages/categories";
import { CouponsPage } from "@/admin/pages/coupons";
import { DashboardPage } from "@/admin/pages/dashboard";
import { LoginPage } from "@/admin/pages/login";
import { NewPasswordPage } from "@/admin/pages/new-password";
import { OrderDetailPage } from "@/admin/pages/order-detail";
import { OrdersPage } from "@/admin/pages/orders";
import { ProductFormPage } from "@/admin/pages/product-form";
import { ProductsPage } from "@/admin/pages/products";
import { StoreSettingsPage } from "@/admin/pages/store-settings";

/** Painel administrativo (carregado sob demanda: não pesa na loja). */
export function AdminApp() {
  return (
    <>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="nova-senha" element={<NewPasswordPage />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="pedidos/:id" element={<OrderDetailPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="produtos/novo" element={<ProductFormPage />} />
          <Route path="produtos/:id" element={<ProductFormPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="cupons" element={<CouponsPage />} />
          <Route path="loja" element={<StoreSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
      <ScrollRestoration />
    </>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const { pathname } = useLocation();
  const status = useDbStatus();
  if (status === "error") return <LoadingScreen error />;
  if (session === undefined || status === "loading") return <LoadingScreen label="Abrindo o painel…" />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: pathname }} />;
  return children;
}

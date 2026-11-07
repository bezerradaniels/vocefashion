import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { BagDrawer } from "@/components/bag-drawer";
import { closeBag, useBagDrawerOpen } from "@/lib/bag-drawer";
import { markVisit } from "@/lib/navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { useDbStatus } from "@/lib/db";

export function Root() {
  const { pathname } = useLocation();
  const bagOpen = useBagDrawerOpen();
  const status = useDbStatus();

  useEffect(() => {
    markVisit();
    closeBag();
  }, [pathname]);

  // Supabase: espera a primeira leitura (evita "peça não encontrada" e vitrine vazia piscando).
  if (status !== "ready") {
    return (
      <>
        <LoadingScreen error={status === "error"} />
        <ScrollRestoration />
      </>
    );
  }

  return (
    <>
      {/* Com a sacola aberta, a página de trás fica inerte (sem foco nem clique). */}
      <div inert={bagOpen}>
        <Outlet />
      </div>
      <BagDrawer />
      <ScrollRestoration />
    </>
  );
}

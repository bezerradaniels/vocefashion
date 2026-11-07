import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { BagDrawer } from "@/components/bag-drawer";
import { closeBag, useBagDrawerOpen } from "@/lib/bag-drawer";
import { markVisit } from "@/lib/navigation";

export function Root() {
  const { pathname } = useLocation();
  const bagOpen = useBagDrawerOpen();

  useEffect(() => {
    markVisit();
    closeBag();
  }, [pathname]);

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

import { useEffect, useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { logout } from "@/admin/auth";
import {
  CloseIcon,
  DashboardIcon,
  ExternalIcon,
  LayersIcon,
  LogoutIcon,
  MenuIcon,
  ReceiptIcon,
  StoreIcon,
  TagIcon,
  TicketIcon,
} from "@/components/icons";
import { cx } from "@/lib/cx";
import { useOrders, useSettings } from "@/lib/db";
import { assetUrl, pageUrl } from "@/lib/asset";

const NAV: { to: string; label: string; icon: ComponentType<{ size?: number }>; end?: boolean }[] = [
  { to: "/admin", label: "Início", icon: DashboardIcon, end: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ReceiptIcon },
  { to: "/admin/produtos", label: "Produtos", icon: TagIcon },
  { to: "/admin/categorias", label: "Categorias", icon: LayersIcon },
  { to: "/admin/cupons", label: "Cupons e promoções", icon: TicketIcon },
  { to: "/admin/loja", label: "Dados da loja", icon: StoreIcon },
];

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const settings = useSettings();
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-alabaster lg:pl-64">
      {/* Barra do topo (celular/tablet) */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-white px-2 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex size-11 items-center justify-center rounded-full bg-icon-btn"
        >
          <MenuIcon />
        </button>
        <span className="truncate font-display text-[17px] font-semibold">{settings.name} · Admin</span>
      </header>

      {/* Fundo do menu no celular */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={cx(
          "fixed inset-0 z-30 bg-charcoal/40 transition-opacity duration-200 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Menu do painel"
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200",
          "lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-line pr-2 pl-4">
          <Link to="/admin" onClick={closeMenu} className="flex min-w-0 items-center gap-2">
            <img
              src={assetUrl(settings.logo)}
              alt=""
              className="size-9 flex-none rounded-full object-cover mix-blend-multiply"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display text-[15px] font-bold">{settings.name}</span>
              <span className="text-[11px] font-medium tracking-[.1em] text-muted uppercase">Painel</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-icon-btn lg:hidden"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} onClick={closeMenu} />
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-line p-3">
          <a
            href={pageUrl("/")}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center gap-3 rounded-full px-3 text-[14px] font-medium text-body-2 hover:bg-icon-btn"
          >
            <ExternalIcon size={20} />
            Ver loja
          </a>
          <LogoutButton />
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onClick,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  end?: boolean;
  onClick: () => void;
}) {
  const waiting = useOrders().filter((o) => o.status === "aguardando_pagamento").length;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          "flex h-11 items-center gap-3 rounded-full px-3 text-[14px] font-medium",
          isActive ? "bg-charcoal text-white" : "text-charcoal hover:bg-icon-btn",
        )
      }
    >
      <Icon size={20} />
      <span className="flex-1">{label}</span>
      {to === "/admin/pedidos" && waiting > 0 && (
        <span
          title={`${waiting} aguardando pagamento`}
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-copper-ink px-1.5 text-[11px] font-semibold text-white"
        >
          {waiting}
        </span>
      )}
    </NavLink>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        void logout().then(() => navigate("/admin/login", { replace: true }));
      }}
      className="flex h-11 items-center gap-3 rounded-full px-3 text-left text-[14px] font-medium text-body-2 hover:bg-icon-btn"
    >
      <LogoutIcon size={20} />
      Sair
    </button>
  );
}

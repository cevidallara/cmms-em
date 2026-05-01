"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Boxes,
  Wrench,
  GaugeCircle,
  LineChart,
  Repeat2,
  Building2,
  Plug,
  LogOut,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

const items = [
  { label: "Dashboard",      href: "/",              icon: Activity },
  { label: "Motores",        href: "/motores",       icon: Boxes },
  { label: "Reparaciones",   href: "/reparaciones",  icon: Wrench },
  { label: "Lecturas",       href: "/lecturas",      icon: GaugeCircle },
  { label: "Comparador",     href: "/comparador",    icon: LineChart },
  { label: "Backups",        href: "/backups",       icon: Repeat2 },
  { label: "Centros",        href: "/centros",       icon: Building2 },
  { label: "Integraciones",  href: "/integraciones", icon: Plug },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    router.push("/login");
  };

  return (
    <>
      <div className="border-b border-border px-5 py-4">
        <Logo />
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          Plataforma
        </div>
      </div>

      {usuario && (
        <div className="border-b border-border px-5 py-4">
          <div className="text-[13px] font-medium text-text">
            {usuario.nombre} {usuario.apellido}
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {usuario.rol?.replace("_", " ")}
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-volt/10 text-text"
                  : "text-text-muted hover:bg-elev/60 hover:text-text"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-volt" : "text-text-dim group-hover:text-text-muted"}
              />
              <span className={active ? "font-medium" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-0.5">
        <Link
          href="/configuracion"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-text-muted transition-colors hover:bg-elev/60 hover:text-text"
        >
          <Settings size={16} className="text-text-dim" />
          Configuración
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-text-muted transition-colors hover:bg-elev/60 hover:text-text"
        >
          <LogOut size={16} className="text-text-dim" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-elev/40 backdrop-blur-xl md:flex">
      <SidebarBody />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-full w-72 flex-col border-r border-border bg-elev shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-bg/40 hover:text-text"
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
            <SidebarBody onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

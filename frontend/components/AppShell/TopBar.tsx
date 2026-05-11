"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { LiveIndicator } from "@/components/LiveIndicator";
import { AnomalyDrawer } from "@/components/anomalies/AnomalyDrawer";
import { useAnomalyCounts } from "@/lib/queries/anomalies";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/motores": "Motores",
  "/reparaciones": "Reparaciones",
  "/lecturas": "Lecturas",
  "/comparador": "Comparador",
  "/backups": "Backups",
  "/centros": "Centros de servicio",
  "/integraciones": "Integraciones",
  "/configuracion": "Configuración",
};

function titleFor(pathname: string) {
  if (pathname === "/") return titles["/"];
  const key = Object.keys(titles).find((k) => k !== "/" && pathname.startsWith(k));
  return key ? titles[key] : "Nikolator";
}

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const [anomaliesOpen, setAnomaliesOpen] = useState(false);
  const countsQuery = useAnomalyCounts();
  const openCount = (countsQuery.data?.open ?? 0) + (countsQuery.data?.acked ?? 0);
  const hasHigh = (countsQuery.data?.bySeverity.high ?? 0) > 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-elev/60 hover:text-text md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={16} />
          </button>
          <h1 className="text-[15px] font-medium text-text">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LiveIndicator />
          </div>
          <div className="sm:hidden">
            <LiveIndicator compact />
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-text-dim transition-colors hover:bg-elev/60 hover:text-text">
            <Search size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAnomaliesOpen(true)}
            className="relative grid h-8 w-8 place-items-center rounded-lg text-text-dim transition-colors hover:bg-elev/60 hover:text-text"
            aria-label={`Anomalías${openCount ? ` (${openCount})` : ""}`}
          >
            <Bell size={16} />
            {openCount > 0 && (
              <span
                className={`absolute right-0.5 top-0.5 grid h-3.5 min-w-[14px] place-items-center rounded-full px-1 font-mono text-[8.5px] font-semibold ${
                  hasHigh ? "bg-danger text-white" : "bg-warning text-bg"
                }`}
              >
                {openCount > 9 ? "9+" : openCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <AnomalyDrawer open={anomaliesOpen} onClose={() => setAnomaliesOpen(false)} />
    </>
  );
}

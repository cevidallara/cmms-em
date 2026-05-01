"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/motores": "Motores",
  "/reparaciones": "Reparaciones",
  "/lecturas": "Lecturas",
  "/comparador": "Comparador",
  "/backups": "Backups",
  "/centros": "Centros de servicio",
  "/configuracion": "Configuración",
};

function titleFor(pathname: string) {
  if (pathname === "/") return titles["/"];
  const key = Object.keys(titles).find((k) => k !== "/" && pathname.startsWith(k));
  return key ? titles[key] : "Nikolator";
}

export function TopBar() {
  const pathname = usePathname();
  const title = titleFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-medium text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="grid h-8 w-8 place-items-center rounded-lg text-text-dim transition-colors hover:bg-elev/60 hover:text-text">
          <Search size={16} />
        </button>
        <button className="relative grid h-8 w-8 place-items-center rounded-lg text-text-dim transition-colors hover:bg-elev/60 hover:text-text">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-volt" />
        </button>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar, MobileSidebar } from "@/components/AppShell/Sidebar";
import { TopBar } from "@/components/AppShell/TopBar";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { LiveProvider } from "@/components/LiveProvider";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) router.replace("/login");
  }, [cargando, usuario, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (cargando || !usuario) return <FullPageSpinner />;

  return (
    <LiveProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
      <ChatPanel />
    </LiveProvider>
  );
}

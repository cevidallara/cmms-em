"use client";

import { useEffect, useState } from "react";
import { useLive } from "./LiveProvider";

export function LiveIndicator({ compact = false }: { compact?: boolean }) {
  const { connected, lastEventAt } = useLive();
  const [recentlyActive, setRecentlyActive] = useState(false);

  useEffect(() => {
    if (!lastEventAt) return;
    setRecentlyActive(true);
    const t = setTimeout(() => setRecentlyActive(false), 2000);
    return () => clearTimeout(t);
  }, [lastEventAt]);

  const dotColor = !connected
    ? "bg-text-dim"
    : recentlyActive
      ? "bg-spark"
      : "bg-success";

  const label = !connected
    ? "Sin conexión"
    : recentlyActive
      ? "Lectura recibida"
      : "En vivo";

  if (compact) {
    return (
      <span
        className="relative flex h-2 w-2"
        title={label}
        aria-label={label}
      >
        {connected && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elev/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
      <span className="relative flex h-1.5 w-1.5">
        {connected && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
      </span>
      {label}
    </span>
  );
}

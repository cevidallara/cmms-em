import type { Prioridad } from "@/lib/types";

const styles: Record<Prioridad, { bg: string; text: string; border: string; pulse?: boolean }> = {
  Baja:       { bg: "bg-elev-2",       text: "text-text-muted", border: "border-border" },
  Mediana:    { bg: "bg-spark/10",     text: "text-spark",      border: "border-spark/30" },
  Alta:       { bg: "bg-warning/10",   text: "text-warning",    border: "border-warning/30" },
  Emergencia: { bg: "bg-danger/10",    text: "text-danger",     border: "border-danger/30", pulse: true },
};

export function PrioridadBadge({ prioridad }: { prioridad?: Prioridad }) {
  const p = prioridad ?? "Mediana";
  const s = styles[p];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${s.border} ${s.bg} px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.text}`}>
      {s.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
        </span>
      )}
      {p}
    </span>
  );
}

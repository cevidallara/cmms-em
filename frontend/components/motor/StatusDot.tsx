type Tone = "running" | "alert" | "standby" | "offline" | "neutral";

const toneStyles: Record<Tone, { dot: string; label: string }> = {
  running: { dot: "bg-success", label: "text-success" },
  alert: { dot: "bg-warning", label: "text-warning" },
  standby: { dot: "bg-text-dim", label: "text-text-dim" },
  offline: { dot: "bg-danger", label: "text-danger" },
  neutral: { dot: "bg-text-dim", label: "text-text-dim" },
};

export function StatusDot({
  tone,
  label,
  pulse,
  className = "",
}: {
  tone: Tone;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const s = toneStyles[tone];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
        style={pulse ? { animation: "pulse-dot 1.6s ease-in-out infinite" } : undefined}
      />
      {label && (
        <span className={`font-mono text-[10px] uppercase tracking-wider ${s.label}`}>
          {label}
        </span>
      )}
    </span>
  );
}

export function toneFromEstado(estado: string | undefined): Tone {
  switch (estado) {
    case "Operativo":
      return "running";
    case "En reparación":
      return "alert";
    case "Fuera de servicio":
      return "offline";
    case "Standby":
      return "standby";
    default:
      return "neutral";
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, RefreshCw, ScanLine, Sparkles, X, XCircle } from "lucide-react";
import {
  useAnomalies,
  useAckAnomaly,
  useResolveAnomaly,
  useMarkFalsePositive,
  useScanAnomalies,
  useRegenerateNarration,
} from "@/lib/queries/anomalies";
import type { Anomaly, AnomalyMetric, AnomalySeverity } from "@/lib/types";

const SEVERITY_RANK: Record<AnomalySeverity, number> = { low: 1, medium: 2, high: 3 };

const SEVERITY_STYLES: Record<AnomalySeverity, string> = {
  low: "border-warning/30 bg-warning/5 text-warning",
  medium: "border-warning/50 bg-warning/10 text-warning",
  high: "border-danger/50 bg-danger/10 text-danger",
};

const METRIC_LABEL: Record<AnomalyMetric, string> = {
  consumoEnergia: "Consumo (kWh)",
  voltaje: "Voltaje (V)",
  corriente: "Corriente (A)",
  factorCarga: "Factor de carga (%)",
  eficienciaEstimada: "Eficiencia (%)",
};

type MotorGroup = {
  motorId: string;
  motorNombre: string;
  worst: AnomalySeverity;
  anomalies: Anomaly[];
};

function groupByMotor(items: Anomaly[]): MotorGroup[] {
  const map = new Map<string, MotorGroup>();
  for (const a of items) {
    const id = typeof a.motorId === "object" ? a.motorId._id : String(a.motorId);
    const nombre = typeof a.motorId === "object" ? a.motorId.nombre : "Motor";
    const existing = map.get(id);
    if (existing) {
      existing.anomalies.push(a);
      if (SEVERITY_RANK[a.severity] > SEVERITY_RANK[existing.worst]) existing.worst = a.severity;
    } else {
      map.set(id, { motorId: id, motorNombre: nombre, worst: a.severity, anomalies: [a] });
    }
  }
  return Array.from(map.values()).sort((x, y) => SEVERITY_RANK[y.worst] - SEVERITY_RANK[x.worst]);
}

export function AnomalyDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const anomaliesQuery = useAnomalies();
  const scanMutation = useScanAnomalies();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const groups = useMemo(() => groupByMotor(anomaliesQuery.data ?? []), [anomaliesQuery.data]);
  const totalAnomalies = (anomaliesQuery.data ?? []).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-border bg-elev/95 backdrop-blur-xl"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                <h2 className="text-[14px] font-medium">Anomalías</h2>
                {totalAnomalies > 0 && (
                  <span className="rounded-full bg-bg/60 px-2 py-0.5 font-mono text-[10px] text-text-muted">
                    {groups.length} motor{groups.length === 1 ? "" : "es"} · {totalAnomalies}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scanMutation.mutate()}
                  disabled={scanMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:border-volt/40 hover:text-volt disabled:opacity-50"
                >
                  {scanMutation.isPending ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : (
                    <ScanLine size={11} />
                  )}
                  Escanear flota
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-7 w-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-elev-2 hover:text-text"
                  aria-label="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {anomaliesQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-bg/40" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-muted">
                  <CheckCircle2 size={28} className="text-success" />
                  <p className="text-[13px]">Todo en orden, no hay anomalías abiertas.</p>
                  <p className="text-[11px] text-text-dim">
                    Escaneá la flota para detectar anomalías sobre las últimas lecturas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((g) => <MotorGroupCard key={g.motorId} group={g} />)}
                </div>
              )}

              {scanMutation.data && (
                <div className="mt-4 rounded-lg border border-border bg-bg/40 px-3 py-2 font-mono text-[11px] text-text-dim">
                  Último scan: {scanMutation.data.motoresEvaluados} motores evaluados ·{" "}
                  {scanMutation.data.anomaliasCreadas} anomalías nuevas
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MotorGroupCard({ group }: { group: MotorGroup }) {
  const [expanded, setExpanded] = useState(true);
  const ack = useAckAnomaly();
  const resolve = useResolveAnomaly();
  const fp = useMarkFalsePositive();

  const styles = SEVERITY_STYLES[group.worst];
  const allOpen = group.anomalies.every(a => a.status === "open");

  function bulk(action: "ack" | "resolve" | "fp") {
    for (const a of group.anomalies) {
      if (action === "ack" && a.status === "open") ack.mutate(a._id);
      if (action === "resolve") resolve.mutate(a._id);
      if (action === "fp") fp.mutate(a._id);
    }
  }

  return (
    <div className={`rounded-xl border ${styles}`}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">{group.worst}</span>
            <span className="font-mono text-[10px] text-text-dim">
              {group.anomalies.length} anomalía{group.anomalies.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-text">{group.motorNombre}</div>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-current/20 px-3 py-3">
          {group.anomalies.map(a => <AnomalyRow key={a._id} anomaly={a} />)}

          <div className="flex flex-wrap gap-1.5 border-t border-current/15 pt-2.5">
            {allOpen && (
              <button
                type="button"
                onClick={() => bulk("ack")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-bg/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted hover:border-spark/40 hover:text-spark"
              >
                <Check size={10} /> Ack todas
              </button>
            )}
            <button
              type="button"
              onClick={() => bulk("resolve")}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-bg/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted hover:border-success/40 hover:text-success"
            >
              <CheckCircle2 size={10} /> Resolver todas
            </button>
            <button
              type="button"
              onClick={() => bulk("fp")}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-bg/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted hover:border-text/30 hover:text-text"
            >
              <XCircle size={10} /> Falsas todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const ack = useAckAnomaly();
  const resolve = useResolveAnomaly();
  const fp = useMarkFalsePositive();
  const regen = useRegenerateNarration();

  const directionArrow = anomaly.direction === "high" ? "↑" : "↓";
  const pctChange =
    anomaly.baselineMedian
      ? ((anomaly.observedValue - anomaly.baselineMedian) / anomaly.baselineMedian) * 100
      : null;

  return (
    <div className="rounded-lg bg-bg/30 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12.5px] text-text">
            {METRIC_LABEL[anomaly.metric]} {directionArrow}{" "}
            <span className="font-mono">{anomaly.observedValue.toFixed(2)}</span>
            {anomaly.baselineMedian != null && (
              <>
                {" "}<span className="text-text-dim">vs</span>{" "}
                <span className="font-mono text-text-muted">{anomaly.baselineMedian.toFixed(2)}</span>
                {pctChange != null && (
                  <span className="ml-1 font-mono text-text-dim">
                    ({pctChange >= 0 ? "+" : ""}{pctChange.toFixed(0)}%)
                  </span>
                )}
              </>
            )}
          </div>
          <div className="font-mono text-[10px] text-text-dim">
            z={anomaly.zScore.toFixed(1)} · {anomaly.severity}
            {anomaly.status === "acked" && " · ACK"}
          </div>
        </div>
      </div>

      <div className="mt-1.5">
        {anomaly.narrationStatus === "pending" ? (
          <div className="flex items-center gap-2 text-[11px] text-text-dim">
            <Sparkles size={10} className="animate-pulse text-spark" />
            Generando narración…
          </div>
        ) : anomaly.narrationStatus === "failed" ? (
          <button
            type="button"
            onClick={() => regen.mutate(anomaly._id)}
            className="text-[11px] text-text-dim underline hover:text-text"
          >
            Reintentar narración
          </button>
        ) : (
          anomaly.narration && (
            <>
              <p className="text-[12px] leading-snug text-text">{anomaly.narration}</p>
              {anomaly.suggestedAction && (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  → {anomaly.suggestedAction}
                </p>
              )}
            </>
          )
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {anomaly.status === "open" && (
          <button
            type="button"
            onClick={() => ack.mutate(anomaly._id)}
            className="inline-flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim hover:border-spark/40 hover:text-spark"
          >
            <Check size={9} /> Ack
          </button>
        )}
        <button
          type="button"
          onClick={() => resolve.mutate(anomaly._id)}
          className="inline-flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim hover:border-success/40 hover:text-success"
        >
          <CheckCircle2 size={9} /> Resuelta
        </button>
        <button
          type="button"
          onClick={() => fp.mutate(anomaly._id)}
          className="inline-flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim hover:border-text/30 hover:text-text"
        >
          <XCircle size={9} /> Falso pos.
        </button>
      </div>
    </div>
  );
}

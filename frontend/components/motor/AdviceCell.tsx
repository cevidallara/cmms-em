"use client";

import { useState, type MouseEvent } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { useMotorAdvice, useCachedAdvice } from "@/lib/queries/advice";
import type { Asset, MotorAdvice, AdviceRecommendation } from "@/lib/types";

const RECOMMENDATION_STYLES: Record<AdviceRecommendation, { label: string; classes: string }> = {
  mantener: { label: "Mantener", classes: "border-success/30 bg-success/10 text-success" },
  reparar: { label: "Reparar", classes: "border-spark/30 bg-spark/10 text-spark" },
  reemplazar: { label: "Reemplazar", classes: "border-warning/30 bg-warning/10 text-warning" },
  swap_a_backup: { label: "Swap a backup", classes: "border-arc/30 bg-arc/10 text-arc" },
  datos_insuficientes: { label: "Sin datos", classes: "border-border bg-bg/40 text-text-dim" },
};

const RISK_LABEL = { bajo: "Bajo", medio: "Medio", alto: "Alto" } as const;

export function AdviceCell({ motor }: { motor: Asset }) {
  const advice = useCachedAdvice(motor._id);
  const mutation = useMotorAdvice();
  const [open, setOpen] = useState(false);

  const isLoadingThis = mutation.isPending && mutation.variables?.motorId === motor._id;

  function handleGenerate(e: MouseEvent) {
    e.stopPropagation();
    mutation.mutate({ motorId: motor._id }, { onSuccess: () => setOpen(true) });
  }

  function handleOpen(e: MouseEvent) {
    e.stopPropagation();
    setOpen(true);
  }

  function handleRegenerate() {
    mutation.mutate({ motorId: motor._id, force: true });
  }

  if (!advice) {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoadingThis}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:border-volt/40 hover:bg-volt/5 hover:text-volt disabled:opacity-50"
      >
        {isLoadingThis ? (
          <RefreshCw size={11} className="animate-spin" />
        ) : (
          <Sparkles size={11} />
        )}
        {isLoadingThis ? "Analizando…" : "Análisis IA"}
      </button>
    );
  }

  const style = RECOMMENDATION_STYLES[advice.recommendation];

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-opacity hover:opacity-80 ${style.classes}`}
        title={advice.recommendationLabel}
      >
        <Sparkles size={11} />
        {style.label}
      </button>
      <AdviceModal
        open={open}
        onClose={() => setOpen(false)}
        motor={motor}
        advice={advice}
        regenerating={isLoadingThis}
        onRegenerate={handleRegenerate}
      />
    </>
  );
}

function AdviceModal({
  open, onClose, motor, advice, regenerating, onRegenerate,
}: {
  open: boolean;
  onClose: () => void;
  motor: Asset;
  advice: MotorAdvice;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  const style = RECOMMENDATION_STYLES[advice.recommendation];
  const fmtUsd = (n: number) =>
    n > 0 ? `USD ${n.toLocaleString("es-CL", { maximumFractionDigits: 0 })}` : "—";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Análisis IA · ${motor.nombre}`}
      description={advice.recommendationLabel}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${style.classes}`}>
            <Sparkles size={12} />
            {style.label}
          </span>
          <Metric label="Ahorro anual estimado" value={fmtUsd(advice.savingsEstimateUsd)} accent={advice.savingsEstimateUsd > 0} />
          {advice.paybackMonths != null && advice.paybackMonths > 0 && (
            <Metric label="Payback" value={`${advice.paybackMonths.toFixed(1)} meses`} />
          )}
          <Metric label="Riesgo de no actuar" value={RISK_LABEL[advice.riskLevel]} />
          <Metric label="Confianza" value={`${Math.round(advice.confidence * 100)}%`} />
        </div>

        <Section title="Razonamiento">
          <p className="text-[13px] leading-relaxed text-text">{advice.reasoning}</p>
        </Section>

        {advice.supuestos.length > 0 && (
          <Section title="Supuestos">
            <ul className="space-y-1 text-[12.5px] text-text-muted">
              {advice.supuestos.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-text-dim" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {advice.proximosPasos.length > 0 && (
          <Section title="Próximos pasos">
            <ol className="space-y-1.5 text-[13px] text-text">
              {advice.proximosPasos.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-[10px] text-volt">{String(i + 1).padStart(2, "0")}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="font-mono text-[10px] text-text-dim">
            Generado {new Date(advice.computedAt).toLocaleString("es-CL")} · {advice.modeloUsado}
          </span>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />}
            onClick={onRegenerate}
            disabled={regenerating}
          >
            Regenerar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className={`mt-0.5 font-mono text-[13px] ${accent ? "text-volt" : "text-text"}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">{title}</div>
      {children}
    </div>
  );
}

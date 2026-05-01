"use client";

import { useMemo } from "react";
import { Check, Lock } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { PrioridadBadge } from "@/components/repair/PrioridadBadge";
import { useRepairs } from "@/lib/queries/repairs";
import type { CentroServicio } from "@/lib/types";

type Props = {
  centro: CentroServicio | null;
  centroOf: (repairId: string) => string | undefined;
  onAssign: (repairId: string, centroId: string) => void;
  onUnassign: (repairId: string) => void;
  onClose: () => void;
};

export function AssignRepairsModal({
  centro,
  centroOf,
  onAssign,
  onUnassign,
  onClose,
}: Props) {
  const repairsQuery = useRepairs();

  const sortedRepairs = useMemo(() => {
    if (!centro) return [];
    return [...(repairsQuery.data ?? [])].sort((a, b) => {
      const aHere = centroOf(a._id) === centro.id ? -1 : 0;
      const bHere = centroOf(b._id) === centro.id ? -1 : 0;
      if (aHere !== bHere) return aHere - bHere;
      return new Date(b.fechaInicio ?? 0).getTime() - new Date(a.fechaInicio ?? 0).getTime();
    });
  }, [centro, centroOf, repairsQuery.data]);

  return (
    <Modal
      open={!!centro}
      onClose={onClose}
      title="Asignar reparaciones"
      description={centro ? `Centro: ${centro.nombre}` : ""}
      size="lg"
    >
      {!centro ? null : sortedRepairs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg/40 px-4 py-8 text-center text-[13px] text-text-muted">
          No hay reparaciones registradas. Crea reparaciones primero desde la sección Reparaciones.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[12px] text-text-muted">
            Click en una reparación para asignarla o quitarla del centro.
            Las que están en otro centro se muestran bloqueadas.
          </div>
          <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto">
            {sortedRepairs.map((r) => {
              const motor =
                typeof r.assetId === "object" && r.assetId ? r.assetId : null;
              const motorName = motor?.nombre ?? "Motor desconocido";
              const currentCentro = centroOf(r._id);
              const isHere = currentCentro === centro.id;
              const isElsewhere = !!currentCentro && !isHere;

              return (
                <li key={r._id}>
                  <button
                    type="button"
                    disabled={isElsewhere}
                    onClick={() =>
                      isHere ? onUnassign(r._id) : onAssign(r._id, centro.id)
                    }
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      isHere
                        ? "border-volt/40 bg-volt/5"
                        : isElsewhere
                        ? "border-border bg-bg/30 opacity-50 cursor-not-allowed"
                        : "border-border bg-bg/40 hover:border-border-strong"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded ${
                        isHere
                          ? "bg-volt text-bg"
                          : isElsewhere
                          ? "bg-elev-2 text-text-dim"
                          : "border border-border"
                      }`}
                    >
                      {isHere ? <Check size={12} /> : isElsewhere ? <Lock size={11} /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-text-dim">
                          #{r._id.slice(-5)}
                        </span>
                        <span className="truncate text-[13px] text-text">{motorName}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-text-muted">
                        {r.descripcion ?? "Sin descripción"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <PrioridadBadge prioridad={r.prioridad} />
                      <span className="font-mono text-[10px] text-text-dim">
                        {r.progreso ?? "Ingresado"}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end border-t border-border pt-3">
            <Button variant="secondary" onClick={onClose}>
              Listo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

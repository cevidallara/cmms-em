"use client";

import { useState } from "react";
import { Boxes, Plus } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { useUpdateMotor } from "@/lib/queries/motors";
import { getActivoRelacionadoId } from "@/lib/utils/backups";
import type { Asset } from "@/lib/types";

type Props = {
  primary: Asset | null;
  freeBackups: Asset[];
  onClose: () => void;
};

export function AssignBackupModal({ primary, freeBackups, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const updateMotor = useUpdateMotor(selectedId ?? "");

  const handleAssign = async () => {
    if (!primary || !selectedId) return;
    setSubmitting(true);
    try {
      await updateMotor.mutateAsync({ activoRelacionado: primary._id });
      onClose();
      setSelectedId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!primary}
      onClose={() => {
        onClose();
        setSelectedId(null);
      }}
      title="Asignar respaldo"
      description={primary ? `Motor principal: ${primary.nombre}` : ""}
      size="md"
    >
      {!primary ? null : freeBackups.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-border bg-bg/40 px-4 py-8 text-center">
            <Boxes className="mx-auto mb-3 text-text-dim" size={20} />
            <div className="text-[13px] text-text">No hay motores de respaldo disponibles</div>
            <div className="mt-1 text-[12px] text-text-muted">
              Crea un motor con la opción "Es de respaldo" activada.
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/motores/nuevo">
              <Button iconLeft={<Plus size={14} />}>Crear motor backup</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-[12px] text-text-muted">
            Selecciona un motor de respaldo libre para asignarlo a{" "}
            <span className="text-text">{primary.nombre}</span>.
          </div>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
            {freeBackups.map((b) => {
              const active = selectedId === b._id;
              return (
                <li key={b._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(b._id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-volt/40 bg-volt/5"
                        : "border-border bg-bg/40 hover:border-border-strong"
                    }`}
                  >
                    <div>
                      <div className="text-[13px] text-text">{b.nombre}</div>
                      <div className="font-mono text-[10px] text-text-dim">
                        {b.tipo}
                        {b.potenciaKW ? ` · ${b.potenciaKW} kW` : ""}
                        {b.cliente ? ` · ${b.cliente}` : ""}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      {b.estadoBackup ?? "Disponible"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="secondary" onClick={() => { onClose(); setSelectedId(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} loading={submitting} disabled={!selectedId}>
              Asignar respaldo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

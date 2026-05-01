"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { useMotors } from "@/lib/queries/motors";
import { buildBackupPairs } from "@/lib/utils/backups";
import type { SwitchoverEntry } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<SwitchoverEntry, "id">) => void;
};

const motivos: SwitchoverEntry["motivo"][] = [
  "Mantenimiento programado",
  "Falla del primario",
  "Prueba",
  "Otro",
];

export function SwitchoverModal({ open, onClose, onSubmit }: Props) {
  const motorsQuery = useMotors();
  const pairs = useMemo(() => {
    const motors = motorsQuery.data ?? [];
    return buildBackupPairs(motors).pairs.filter((p) => !!p.backup);
  }, [motorsQuery.data]);

  const [primaryId, setPrimaryId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16));
  const [motivo, setMotivo] = useState<SwitchoverEntry["motivo"]>("Mantenimiento programado");
  const [duracion, setDuracion] = useState("");
  const [notas, setNotas] = useState("");

  const selectedPair = pairs.find((p) => p.primary._id === primaryId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPair?.backup) return;
    onSubmit({
      fecha: new Date(fecha).toISOString(),
      primaryId: selectedPair.primary._id,
      backupId: selectedPair.backup._id,
      motivo,
      duracionMin: duracion ? Number(duracion) : undefined,
      notas: notas || undefined,
    });
    setPrimaryId("");
    setDuracion("");
    setNotas("");
    setMotivo("Mantenimiento programado");
    setFecha(new Date().toISOString().slice(0, 16));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar switchover"
      description="Anota cuándo y por qué se activó un motor de respaldo."
      size="md"
    >
      {pairs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg/40 px-4 py-8 text-center">
          <div className="text-[13px] text-text">Sin pares primary→backup</div>
          <div className="mt-1 text-[12px] text-text-muted">
            Asigna un respaldo a un motor antes de registrar un switchover.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            label="Motor principal"
            value={primaryId}
            onChange={(e) => setPrimaryId(e.target.value)}
            required
            options={[
              { value: "", label: "— Seleccionar —" },
              ...pairs.map((p) => ({
                value: p.primary._id,
                label: `${p.primary.nombre} → ${p.backup!.nombre}`,
              })),
            ]}
          />

          {selectedPair && (
            <div className="rounded-lg border border-spark/20 bg-spark/5 px-3 py-2 text-[12px] text-text-muted">
              Se registrará: <span className="text-text">{selectedPair.primary.nombre}</span> →{" "}
              <span className="text-text">{selectedPair.backup!.nombre}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Fecha y hora"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
            <SelectField
              label="Motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as SwitchoverEntry["motivo"])}
              options={motivos.map((m) => ({ value: m, label: m }))}
            />
          </div>

          <Field
            label="Duración (minutos)"
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            placeholder="opcional"
          />

          <Field
            label="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="opcional"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!primaryId}>
              Registrar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

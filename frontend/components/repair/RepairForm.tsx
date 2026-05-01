"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  PRIORIDADES,
  PROGRESOS,
  type Repair,
  type RepairInput,
} from "@/lib/types";
import { useMotors } from "@/lib/queries/motors";
import { Field, SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Props = {
  initial?: Repair;
  defaultAssetId?: string;
  onSubmit: (input: RepairInput) => Promise<unknown>;
  onSuccess?: () => void;
  submitLabel: string;
};

export function RepairForm({ initial, defaultAssetId, onSubmit, onSuccess, submitLabel }: Props) {
  const motorsQuery = useMotors();
  const [form, setForm] = useState<RepairInput>(() => {
    if (initial) {
      return {
        assetId:
          typeof initial.assetId === "string" ? initial.assetId : initial.assetId._id,
        tecnico: initial.tecnico,
        descripcion: initial.descripcion ?? "",
        prioridad: initial.prioridad ?? "Mediana",
        progreso: initial.progreso ?? "Ingresado",
        otCliente: initial.otCliente ?? "",
        nrcv: initial.nrcv ?? "",
        responsable: initial.responsable ?? "",
        sector: initial.sector ?? "",
      };
    }
    return {
      assetId: defaultAssetId ?? "",
      tecnico: "",
      descripcion: "",
      prioridad: "Mediana",
      progreso: "Ingresado",
    };
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof RepairInput>(key: K, value: RepairInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(form);
      onSuccess?.();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Error al guardar la reparación";
      setError(msg);
      setSubmitting(false);
    }
  };

  const motorOptions = (motorsQuery.data ?? []).map((m) => ({
    value: m._id,
    label: `${m.nombre} · ${m.cliente}${m.sector ? ` / ${m.sector}` : ""}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      {!defaultAssetId && (
        <SelectField
          label="Motor"
          value={form.assetId}
          onChange={(e) => set("assetId", e.target.value)}
          required
          options={[
            { value: "", label: motorsQuery.isLoading ? "Cargando…" : "— Seleccionar —" },
            ...motorOptions,
          ]}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Técnico responsable"
          value={form.tecnico}
          onChange={(e) => set("tecnico", e.target.value)}
          required
          placeholder="ej. Juan Pérez"
        />
        <SelectField
          label="Prioridad"
          value={form.prioridad ?? "Mediana"}
          onChange={(e) => set("prioridad", e.target.value as RepairInput["prioridad"])}
          options={PRIORIDADES.map((p) => ({ value: p, label: p }))}
        />
      </div>

      <Field
        label="Descripción / falla detectada"
        value={form.descripcion ?? ""}
        onChange={(e) => set("descripcion", e.target.value)}
        placeholder="ej. Excentricidad detectada en el rotor"
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Etapa"
          value={form.progreso ?? "Ingresado"}
          onChange={(e) => set("progreso", e.target.value as RepairInput["progreso"])}
          options={PROGRESOS.map((p) => ({ value: p, label: p }))}
        />
        <Field
          label="OT cliente"
          value={form.otCliente ?? ""}
          onChange={(e) => set("otCliente", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

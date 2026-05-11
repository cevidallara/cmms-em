"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { ReadingInput } from "@/lib/types";

type Props = {
  assetId: string;
  onSubmit: (input: ReadingInput) => Promise<unknown>;
  onSuccess?: () => void;
};

export function ReadingForm({ assetId, onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState<ReadingInput>({
    assetId,
    consumoEnergia: undefined,
    voltaje: undefined,
    corriente: undefined,
    horasOperacion: undefined,
    factorCarga: undefined,
    eficienciaEstimada: undefined,
    fecha: new Date().toISOString().slice(0, 16),
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof ReadingInput>(key: K, value: ReadingInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        consumoEnergia: form.consumoEnergia != null ? Number(form.consumoEnergia) : undefined,
        voltaje: form.voltaje != null ? Number(form.voltaje) : undefined,
        corriente: form.corriente != null ? Number(form.corriente) : undefined,
        horasOperacion: form.horasOperacion != null ? Number(form.horasOperacion) : undefined,
        factorCarga: form.factorCarga != null ? Number(form.factorCarga) : undefined,
        eficienciaEstimada: form.eficienciaEstimada != null ? Number(form.eficienciaEstimada) : undefined,
        fecha: form.fecha ? new Date(form.fecha).toISOString() : undefined,
      });
      onSuccess?.();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Error al guardar la lectura";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Consumo (kWh)"
          type="number"
          step="0.1"
          value={form.consumoEnergia ?? ""}
          onChange={(e) =>
            set("consumoEnergia", e.target.value ? Number(e.target.value) : undefined)
          }
          required
          placeholder="ej. 124.8"
        />
        <Field
          label="Fecha y hora"
          type="datetime-local"
          value={form.fecha ?? ""}
          onChange={(e) => set("fecha", e.target.value)}
        />
        <Field
          label="Voltaje (V)"
          type="number"
          step="0.1"
          value={form.voltaje ?? ""}
          onChange={(e) =>
            set("voltaje", e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <Field
          label="Corriente (A)"
          type="number"
          step="0.1"
          value={form.corriente ?? ""}
          onChange={(e) =>
            set("corriente", e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <Field
          label="Horas operación"
          type="number"
          step="0.1"
          value={form.horasOperacion ?? ""}
          onChange={(e) =>
            set("horasOperacion", e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <Field
          label="Factor de carga (%)"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={form.factorCarga ?? ""}
          onChange={(e) =>
            set("factorCarga", e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder="ej. 75"
        />
        <Field
          label="Eficiencia estimada (%)"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={form.eficienciaEstimada ?? ""}
          onChange={(e) =>
            set("eficienciaEstimada", e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder="ej. 85"
          containerClassName="col-span-2"
        />
        <Field
          label="Observaciones"
          value={form.observaciones ?? ""}
          onChange={(e) => set("observaciones", e.target.value)}
          containerClassName="col-span-2"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          Guardar lectura
        </Button>
      </div>
    </form>
  );
}

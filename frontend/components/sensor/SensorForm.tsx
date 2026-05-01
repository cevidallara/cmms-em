"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Field, SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  SENSOR_PROVIDERS,
  SENSOR_TYPES,
  type SensorInput,
} from "@/lib/types";

type Props = {
  defaultAssetId: string;
  onSubmit: (input: SensorInput) => Promise<unknown>;
  onSuccess?: () => void;
};

export function SensorForm({ defaultAssetId, onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState<SensorInput>({
    assetId: defaultAssetId,
    provider: "webhook",
    externalId: "",
    type: "general",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          : "Error al crear el sensor";
      setError(msg);
      setSubmitting(false);
    }
  };

  // Filtrar providers que muestran "soon" — no ofrecer providers no implementados aún
  const availableProviders = SENSOR_PROVIDERS.filter(
    (p) => p.status === "active"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Proveedor"
          value={form.provider}
          onChange={(e) =>
            setForm((f) => ({ ...f, provider: e.target.value as SensorInput["provider"] }))
          }
          options={availableProviders.map((p) => ({ value: p.value, label: p.label }))}
        />
        <SelectField
          label="Tipo de medición"
          value={form.type ?? "general"}
          onChange={(e) =>
            setForm((f) => ({ ...f, type: e.target.value as SensorInput["type"] }))
          }
          options={SENSOR_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      <Field
        label="External ID"
        value={form.externalId}
        onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))}
        required
        placeholder="ej. DYN-1234, motor-norte-01"
        hint="ID único que el proveedor o tu sistema usa para identificar el sensor."
      />

      <div className="rounded-lg border border-spark/20 bg-spark/5 px-3 py-2.5 text-[12px] text-text-muted">
        Para empezar a recibir datos, manda un POST a <span className="font-mono text-spark">/api/ingest</span>{" "}
        con tu API key y este externalId. Ver <span className="text-text">Integraciones</span> → Webhook para el ejemplo.
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={submitting}>
          Conectar sensor
        </Button>
      </div>
    </form>
  );
}

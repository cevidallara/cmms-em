"use client";

import { useState, type FormEvent } from "react";
import { Field, SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { CentroServicio, CentroServicioInput } from "@/lib/types";

type Props = {
  initial?: CentroServicio;
  onSubmit: (input: CentroServicioInput) => void;
  onCancel: () => void;
  submitLabel: string;
};

const especialidades = [
  "Motores eléctricos",
  "Bombas",
  "Compresores",
  "Bobinado",
  "Mecanizado",
  "Eléctrica industrial",
  "Otro",
];

export function CentroForm({ initial, onSubmit, onCancel, submitLabel }: Props) {
  const [form, setForm] = useState<CentroServicioInput>(() => ({
    nombre: initial?.nombre ?? "",
    contacto: initial?.contacto ?? "",
    email: initial?.email ?? "",
    telefono: initial?.telefono ?? "",
    ubicacion: initial?.ubicacion ?? "",
    especialidad: initial?.especialidad ?? "Motores eléctricos",
    rating: initial?.rating ?? 4.5,
    reparacionesCompletadas: initial?.reparacionesCompletadas ?? 0,
    notas: initial?.notas ?? "",
  }));
  const [error, setError] = useState("");

  const set = <K extends keyof CentroServicioInput>(key: K, value: CentroServicioInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (form.rating != null && (form.rating < 0 || form.rating > 5)) {
      setError("El rating debe estar entre 0 y 5");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      <Field
        label="Nombre del centro"
        value={form.nombre}
        onChange={(e) => set("nombre", e.target.value)}
        required
        placeholder="ej. Servicios Sur SA"
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Especialidad"
          value={form.especialidad ?? "Motores eléctricos"}
          onChange={(e) => set("especialidad", e.target.value)}
          options={especialidades.map((v) => ({ value: v, label: v }))}
        />
        <Field
          label="Ubicación"
          value={form.ubicacion ?? ""}
          onChange={(e) => set("ubicacion", e.target.value)}
          placeholder="ej. Concepción, Chile"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Contacto"
          value={form.contacto ?? ""}
          onChange={(e) => set("contacto", e.target.value)}
          placeholder="ej. María González"
        />
        <Field
          label="Email"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="contacto@centro.cl"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="Teléfono"
          value={form.telefono ?? ""}
          onChange={(e) => set("telefono", e.target.value)}
          placeholder="+56 9 …"
        />
        <Field
          label="Rating (0–5)"
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={form.rating ?? ""}
          onChange={(e) =>
            set("rating", e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <Field
          label="Reparaciones histórico"
          type="number"
          value={form.reparacionesCompletadas ?? ""}
          onChange={(e) =>
            set("reparacionesCompletadas", e.target.value ? Number(e.target.value) : 0)
          }
        />
      </div>

      <Field
        label="Notas"
        value={form.notas ?? ""}
        onChange={(e) => set("notas", e.target.value)}
        placeholder="opcional"
      />

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  TIPOS_MOTOR,
  ESTADOS_ACTUAL,
  ESTADOS_BACKUP,
  type Asset,
  type AssetInput,
} from "@/lib/types";
import { useMotors } from "@/lib/queries/motors";
import { Field, SelectField } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  initial?: Asset;
  onSubmit: (input: AssetInput) => Promise<unknown>;
  submitLabel: string;
};

const emptyForm: AssetInput = {
  nombre: "",
  tipo: "Motor eléctrico",
  modelo: "",
  marca: "",
  numeroSerie: "",
  potenciaKW: undefined,
  cliente: "",
  sector: "",
  ubicacion: "",
  categoria: "",
  subcategoria: "",
  estadoActual: "Operativo",
  esBackup: false,
  estadoBackup: undefined,
  activoRelacionado: undefined,
  proveedor: "",
  fechaAdquisicion: undefined,
  costo: undefined,
};

export function MotorForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const motorsQuery = useMotors();
  const [form, setForm] = useState<AssetInput>(() => {
    if (!initial) return emptyForm;
    return {
      nombre: initial.nombre,
      tipo: initial.tipo,
      modelo: initial.modelo ?? "",
      marca: initial.marca ?? "",
      numeroSerie: initial.numeroSerie ?? "",
      potenciaKW: initial.potenciaKW,
      cliente: initial.cliente,
      sector: initial.sector ?? "",
      ubicacion: initial.ubicacion ?? "",
      categoria: initial.categoria ?? "",
      subcategoria: initial.subcategoria ?? "",
      estadoActual: initial.estadoActual ?? "Operativo",
      esBackup: initial.esBackup ?? false,
      estadoBackup: initial.estadoBackup,
      activoRelacionado:
        typeof initial.activoRelacionado === "string"
          ? initial.activoRelacionado
          : initial.activoRelacionado?._id ?? undefined,
      proveedor: initial.proveedor ?? "",
      fechaAdquisicion: initial.fechaAdquisicion?.slice(0, 10),
      costo: initial.costo,
    };
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof AssetInput>(key: K, value: AssetInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: AssetInput = {
        ...form,
        potenciaKW: form.potenciaKW ? Number(form.potenciaKW) : undefined,
        costo: form.costo ? Number(form.costo) : undefined,
        fechaAdquisicion: form.fechaAdquisicion || undefined,
        estadoBackup: form.esBackup ? form.estadoBackup ?? "Disponible" : undefined,
        activoRelacionado: form.esBackup ? form.activoRelacionado || undefined : undefined,
      };
      await onSubmit(payload);
      router.push("/motores");
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Error al guardar el motor";
      setError(msg);
      setSubmitting(false);
    }
  };

  const principalOptions = (motorsQuery.data ?? [])
    .filter((m) => !m.esBackup && m._id !== initial?._id)
    .map((m) => ({ value: m._id, label: `${m.nombre} (${m.tipo})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      <Card className="p-6">
        <SectionTitle>Identificación</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Nombre"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            placeholder="ej. Bomba P-1"
          />
          <SelectField
            label="Tipo"
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            options={TIPOS_MOTOR.map((t) => ({ value: t, label: t }))}
            required
          />
          <Field
            label="Marca"
            value={form.marca}
            onChange={(e) => set("marca", e.target.value)}
            placeholder="ej. WEG"
          />
          <Field
            label="Modelo"
            value={form.modelo}
            onChange={(e) => set("modelo", e.target.value)}
            placeholder="ej. W22"
          />
          <Field
            label="N° de serie"
            value={form.numeroSerie}
            onChange={(e) => set("numeroSerie", e.target.value)}
            containerClassName="sm:col-span-2"
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>Especificaciones</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Potencia nominal (kW)"
            type="number"
            step="0.1"
            value={form.potenciaKW ?? ""}
            onChange={(e) =>
              set("potenciaKW", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="ej. 75"
          />
          <SelectField
            label="Estado actual"
            value={form.estadoActual ?? "Operativo"}
            onChange={(e) => set("estadoActual", e.target.value)}
            options={ESTADOS_ACTUAL.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>Ubicación</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Planta / sitio"
            value={form.cliente}
            onChange={(e) => set("cliente", e.target.value)}
            required
            placeholder="ej. Planta Sur"
          />
          <Field
            label="Sector"
            value={form.sector}
            onChange={(e) => set("sector", e.target.value)}
            placeholder="ej. Bombeo Norte"
          />
          <Field
            label="Ubicación específica"
            value={form.ubicacion}
            onChange={(e) => set("ubicacion", e.target.value)}
            placeholder="ej. Sala 3 — fila A"
            containerClassName="sm:col-span-2"
          />
          <Field
            label="Categoría"
            value={form.categoria}
            onChange={(e) => set("categoria", e.target.value)}
          />
          <Field
            label="Subcategoría"
            value={form.subcategoria}
            onChange={(e) => set("subcategoria", e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>Backup</SectionTitle>
        <Toggle
          checked={!!form.esBackup}
          onChange={(v) => set("esBackup", v)}
          label="Este motor es de respaldo"
          description="Si está activado, se podrá asignar a un motor primario."
        />
        {form.esBackup && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Estado del backup"
              value={form.estadoBackup ?? "Disponible"}
              onChange={(e) =>
                set("estadoBackup", e.target.value as typeof form.estadoBackup)
              }
              options={ESTADOS_BACKUP.map((s) => ({ value: s, label: s }))}
            />
            <SelectField
              label="Motor principal"
              value={(form.activoRelacionado as string) ?? ""}
              onChange={(e) => set("activoRelacionado", e.target.value || undefined)}
              options={[
                { value: "", label: "— Sin asignar —" },
                ...principalOptions,
              ]}
            />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <SectionTitle>Comercial</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Proveedor"
            value={form.proveedor}
            onChange={(e) => set("proveedor", e.target.value)}
          />
          <Field
            label="Fecha de adquisición"
            type="date"
            value={form.fechaAdquisicion ?? ""}
            onChange={(e) => set("fechaAdquisicion", e.target.value)}
          />
          <Field
            label="Costo (USD)"
            type="number"
            value={form.costo ?? ""}
            onChange={(e) =>
              set("costo", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          size="lg"
        >
          Cancelar
        </Button>
        <Button type="submit" loading={submitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
      <span className="mr-2 inline-block h-1 w-1 rounded-full bg-volt align-middle" />
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import {
  useExtractNameplate,
  useCreateFromExtraction,
  type NameplateSpecs,
} from "@/lib/queries/onboarding";

const TIPOS = ["Motor eléctrico", "Bomba", "Compresor", "Ventilador", "Otro"];

type EditableForm = {
  nombre: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  potenciaKW: string;
  cliente: string;
  sector: string;
};

export function NameplateUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [specs, setSpecs] = useState<NameplateSpecs | null>(null);
  const [form, setForm] = useState<EditableForm>({
    nombre: "", tipo: "Motor eléctrico", marca: "", modelo: "", numeroSerie: "",
    potenciaKW: "", cliente: "", sector: "",
  });

  const extract = useExtractNameplate();
  const create = useCreateFromExtraction();

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFile(f: File) {
    setFile(f);
    setSpecs(null);
    create.reset();
    extract.reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    extract.mutate(f, {
      onSuccess: (s) => {
        setSpecs(s);
        setForm((prev) => ({
          ...prev,
          nombre: s.nombre || prev.nombre,
          tipo: s.tipo || prev.tipo,
          marca: s.marca || prev.marca,
          modelo: s.modelo || prev.modelo,
          numeroSerie: s.numeroSerie || prev.numeroSerie,
          potenciaKW: s.potenciaKW != null ? String(s.potenciaKW) : prev.potenciaKW,
        }));
      },
    });
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setSpecs(null);
    extract.reset();
    create.reset();
    setForm({
      nombre: "", tipo: "Motor eléctrico", marca: "", modelo: "", numeroSerie: "",
      potenciaKW: "", cliente: "", sector: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function set<K extends keyof EditableForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCreate() {
    if (!specs) return;
    const merged: NameplateSpecs = {
      ...specs,
      nombre: form.nombre,
      tipo: form.tipo,
      marca: form.marca || undefined,
      modelo: form.modelo || undefined,
      numeroSerie: form.numeroSerie || undefined,
      potenciaKW: form.potenciaKW ? Number(form.potenciaKW) : undefined,
    };
    create.mutate({
      specs: merged,
      nombre: form.nombre,
      tipo: form.tipo,
      cliente: form.cliente,
      sector: form.sector || undefined,
    });
  }

  if (!file) {
    return (
      <Card
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-12 text-center transition-colors hover:border-border-strong"
      >
        <Camera size={40} className="text-text-dim" />
        <div>
          <div className="text-[14px] font-medium text-text">Tomá una foto de la placa del motor</div>
          <div className="mt-1 text-[12px] text-text-muted">
            Claude vision extrae marca, modelo, potencia y demás specs en segundos
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onInputChange}
          className="hidden"
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-border bg-bg/40">
          {previewUrl && (
            <img src={previewUrl} alt="Placa" className="aspect-[4/3] w-full object-contain" />
          )}
          <button
            type="button"
            onClick={reset}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-bg/80 text-text-muted backdrop-blur transition-colors hover:bg-bg hover:text-text"
            aria-label="Cambiar"
          >
            <X size={14} />
          </button>
        </div>

        {extract.isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-4 py-3 text-[13px] text-text-muted">
            <RefreshCw size={14} className="animate-spin text-spark" />
            Extrayendo specs con visión IA…
          </div>
        )}
        {extract.isError && (
          <ErrorBanner message={(extract.error as Error)?.message || "Error al extraer"} />
        )}
        {specs && (
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-volt" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  Confianza extracción
                </span>
              </div>
              <span className={`font-mono text-[12px] ${specs.confidence >= 0.7 ? "text-volt" : specs.confidence >= 0.4 ? "text-warning" : "text-danger"}`}>
                {Math.round(specs.confidence * 100)}%
              </span>
            </div>
            {specs.campoIlegibles && specs.campoIlegibles.length > 0 && (
              <div className="mt-2 text-[11px] text-text-muted">
                Ilegibles: {specs.campoIlegibles.join(", ")}
              </div>
            )}
          </Card>
        )}
      </div>

      {specs && (
        <Card className="space-y-3 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Confirmá los datos antes de crear
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Nombre del motor"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
              placeholder="ej. M-210"
              containerClassName="col-span-2"
            />
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => set("tipo", e.target.value)}
                className="block w-full rounded-md border border-border bg-bg/60 px-3 py-2 text-[13px] text-text outline-none focus:border-volt/50"
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Potencia (kW)" type="number" step="0.01" value={form.potenciaKW} onChange={(e) => set("potenciaKW", e.target.value)} />
            <Field label="Marca" value={form.marca} onChange={(e) => set("marca", e.target.value)} />
            <Field label="Modelo" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} />
            <Field label="N° de serie" value={form.numeroSerie} onChange={(e) => set("numeroSerie", e.target.value)} containerClassName="col-span-2" />
            <Field label="Cliente / Planta" value={form.cliente} onChange={(e) => set("cliente", e.target.value)} required />
            <Field label="Sector" value={form.sector} onChange={(e) => set("sector", e.target.value)} />
          </div>

          {create.isError && (
            <ErrorBanner message={(create.error as Error)?.message || "Error al crear motor"} />
          )}
          {create.data && (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-[13px] text-success">
              <CheckCircle2 size={14} />
              Motor creado. <button onClick={() => router.push(`/motores/${create.data._id}`)} className="underline">Verlo</button>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              loading={create.isPending}
              disabled={!form.nombre || !form.cliente}
            >
              Crear motor
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

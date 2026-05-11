"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileSpreadsheet, RefreshCw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  usePreviewSpreadsheet,
  useImportSpreadsheet,
  type ColumnMapping,
  type SpreadsheetPreview,
  type SpreadsheetMapping,
} from "@/lib/queries/onboarding";

const ASSET_TARGET_FIELDS = [
  "nombre", "tipo", "modelo", "marca", "numeroSerie",
  "potenciaKW", "cliente", "sector", "ubicacion",
  "estadoActual", "categoria", "subcategoria",
  "esBackup", "proveedor", "fechaAdquisicion", "costo",
];

const TRANSFORMATIONS = [
  { value: "none", label: "Sin transformación" },
  { value: "hp_to_kw", label: "HP → kW" },
  { value: "parse_number", label: "Parsear número" },
  { value: "trim", label: "Trim" },
  { value: "parse_date", label: "Parsear fecha" },
  { value: "normalize_tipo", label: "Normalizar tipo" },
];

export function SpreadsheetUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SpreadsheetPreview | null>(null);
  const [editedMapping, setEditedMapping] = useState<ColumnMapping[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const previewMutation = usePreviewSpreadsheet();
  const importMutation = useImportSpreadsheet();

  function handleFile(f: File) {
    setFile(f);
    setPreview(null);
    setEditedMapping([]);
    importMutation.reset();
    previewMutation.mutate(f, {
      onSuccess: (data) => {
        setPreview(data);
        setEditedMapping(data.mapping.columnMappings);
      },
    });
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function updateMapping(idx: number, patch: Partial<ColumnMapping>) {
    setEditedMapping((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  function removeMapping(idx: number) {
    setEditedMapping((prev) => prev.filter((_, i) => i !== idx));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setEditedMapping([]);
    previewMutation.reset();
    importMutation.reset();
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleImport(dryRun: boolean) {
    if (!file || !preview) return;
    const finalMapping: SpreadsheetMapping = {
      columnMappings: editedMapping,
      defaultValues: preview.mapping.defaultValues,
      warnings: preview.mapping.warnings,
      detectedRowCountColumn: preview.mapping.detectedRowCountColumn,
    };
    importMutation.mutate({ file, mapping: finalMapping, dryRun });
  }

  if (!file) {
    return (
      <Card
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-12 text-center transition-colors ${
          dragOver ? "border-volt bg-volt/5" : "hover:border-border-strong"
        }`}
      >
        <FileSpreadsheet size={40} className="text-text-dim" />
        <div>
          <div className="text-[14px] font-medium text-text">Arrastrá un Excel o CSV</div>
          <div className="mt-1 text-[12px] text-text-muted">
            o click para seleccionar — el agente detecta las columnas automáticamente
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.ods"
          onChange={onInputChange}
          className="hidden"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2">
        <FileSpreadsheet size={16} className="text-text-muted" />
        <span className="flex-1 truncate text-[13px] text-text">{file.name}</span>
        {previewMutation.isPending && <RefreshCw size={14} className="animate-spin text-spark" />}
        <button
          type="button"
          onClick={reset}
          className="grid h-7 w-7 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-text"
        >
          <X size={14} />
        </button>
      </div>

      {previewMutation.isError && (
        <ErrorBanner message={(previewMutation.error as Error)?.message || "Error al procesar archivo"} />
      )}

      {previewMutation.isPending && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-4 py-3 text-[13px] text-text-muted">
          <RefreshCw size={14} className="animate-spin text-spark" />
          Analizando columnas con IA…
        </div>
      )}

      {preview && (
        <>
          {preview.mapping.warnings?.length > 0 && (
            <Card className="border-warning/30 bg-warning/5 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-warning" />
                <ul className="space-y-1 text-[12.5px] text-warning">
                  {preview.mapping.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Mapeo de columnas
              </div>
              <div className="text-[13px] text-text">
                {preview.totalRows} filas detectadas · {editedMapping.length} columnas mapeadas
              </div>
            </div>
            <div className="divide-y divide-border">
              {editedMapping.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center gap-2 px-4 py-2.5 text-[12.5px]">
                  <div className="col-span-4 truncate text-text" title={m.sourceColumn}>
                    {m.sourceColumn}
                  </div>
                  <div className="col-span-1 text-center text-text-dim">→</div>
                  <select
                    value={m.targetField}
                    onChange={(e) => updateMapping(idx, { targetField: e.target.value })}
                    className="col-span-3 rounded-md border border-border bg-bg/60 px-2 py-1 text-[12px] text-text outline-none focus:border-volt/50"
                  >
                    {ASSET_TARGET_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select
                    value={m.transformation}
                    onChange={(e) => updateMapping(idx, { transformation: e.target.value as ColumnMapping["transformation"] })}
                    className="col-span-3 rounded-md border border-border bg-bg/60 px-2 py-1 text-[12px] text-text outline-none focus:border-volt/50"
                  >
                    {TRANSFORMATIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMapping(idx)}
                    className="col-span-1 grid h-7 w-7 place-items-center justify-self-end rounded-md text-text-dim transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Quitar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {preview.sampleRows?.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Preview (primeras filas)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-bg/30">
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 font-mono text-[10px] uppercase text-text-dim">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.sampleRows.map((row, i) => (
                      <tr key={i}>
                        {preview.headers.map((h) => (
                          <td key={h} className="whitespace-nowrap px-3 py-2 text-text">
                            {String(row[h] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {importMutation.isError && (
            <ErrorBanner message={(importMutation.error as Error)?.message || "Error al importar"} />
          )}

          {importMutation.data && (
            <Card className={`p-4 ${importMutation.data.dryRun ? "border-spark/30 bg-spark/5" : "border-success/30 bg-success/5"}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={importMutation.data.dryRun ? "text-spark" : "text-success"} />
                <div className="text-[13px] text-text">
                  {importMutation.data.dryRun ? "Dry run: " : ""}
                  {importMutation.data.created} motores {importMutation.data.dryRun ? "se crearían" : "creados"}
                  {importMutation.data.skipped > 0 && ` · ${importMutation.data.skipped} saltadas`}
                </div>
              </div>
              {importMutation.data.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-text-muted">
                  {importMutation.data.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>Fila {e.row}: {e.reason}</li>
                  ))}
                  {importMutation.data.errors.length > 5 && (
                    <li className="text-text-dim">… y {importMutation.data.errors.length - 5} más</li>
                  )}
                </ul>
              )}
              {!importMutation.data.dryRun && importMutation.data.created > 0 && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => router.push("/motores")}>
                    Ver motores
                  </Button>
                </div>
              )}
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => handleImport(true)}
              loading={importMutation.isPending}
              disabled={editedMapping.length === 0}
            >
              Dry run
            </Button>
            <Button
              onClick={() => handleImport(false)}
              loading={importMutation.isPending}
              disabled={editedMapping.length === 0}
              iconLeft={<Upload size={14} />}
            >
              Importar {preview.totalRows} motores
            </Button>
          </div>
        </>
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

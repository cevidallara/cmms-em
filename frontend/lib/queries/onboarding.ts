"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Asset } from "@/lib/types";

export type ColumnMapping = {
  sourceColumn: string;
  targetField: string;
  transformation: "none" | "hp_to_kw" | "parse_number" | "trim" | "parse_date" | "normalize_tipo";
  confidence?: number;
};

export type SpreadsheetMapping = {
  columnMappings: ColumnMapping[];
  defaultValues?: Record<string, unknown>;
  warnings: string[];
  detectedRowCountColumn?: string;
};

export type SpreadsheetPreview = {
  headers: string[];
  totalRows: number;
  sampleRows: Record<string, unknown>[];
  mapping: SpreadsheetMapping;
};

export type NameplateSpecs = {
  nombre?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  tipo?: string;
  potenciaKW?: number;
  voltajeNominal?: number;
  corrienteNominal?: number;
  rpm?: number;
  frecuencia?: number;
  claseIE?: "IE1" | "IE2" | "IE3" | "IE4";
  ipRating?: string;
  pesoKg?: number;
  confidence: number;
  campoIlegibles?: string[];
};

export function usePreviewSpreadsheet() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<SpreadsheetPreview>(
        "/ai/onboard/preview-spreadsheet",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
  });
}

export function useImportSpreadsheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      file: File;
      mapping: SpreadsheetMapping;
      dryRun?: boolean;
    }) => {
      const fd = new FormData();
      fd.append("file", vars.file);
      fd.append("mapping", JSON.stringify(vars.mapping));
      if (vars.dryRun) fd.append("dryRun", "true");
      const { data } = await api.post<{
        created: number;
        skipped: number;
        errors: Array<{ row: number; reason: string }>;
        dryRun: boolean;
        totalRows: number;
      }>("/ai/onboard/import-spreadsheet", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      if (!data.dryRun && data.created > 0) {
        qc.invalidateQueries({ queryKey: ["motors"] });
      }
    },
  });
}

export function useExtractNameplate() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ specs: NameplateSpecs }>(
        "/ai/onboard/extract-nameplate",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.specs;
    },
  });
}

export function useCreateFromExtraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      specs: NameplateSpecs;
      nombre: string;
      tipo: string;
      cliente: string;
      sector?: string;
    }) => {
      const { data } = await api.post<Asset>("/ai/onboard/create-from-extraction", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motors"] });
    },
  });
}

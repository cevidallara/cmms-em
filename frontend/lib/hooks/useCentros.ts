"use client";

import { useCallback, useEffect, useState } from "react";
import type { CentroServicio, CentroServicioInput } from "@/lib/types";

const STORAGE_KEY = "nikolator.centros.v1";

function genId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCentros() {
  const [entries, setEntries] = useState<CentroServicio[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore quota errors
    }
  }, [entries, hydrated]);

  const add = useCallback((input: CentroServicioInput) => {
    const centro: CentroServicio = {
      ...input,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [centro, ...prev]);
    return centro;
  }, []);

  const update = useCallback((id: string, input: Partial<CentroServicioInput>) => {
    setEntries((prev) => prev.map((c) => (c.id === id ? { ...c, ...input } : c)));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { entries, add, update, remove, hydrated };
}

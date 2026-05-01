"use client";

import { useEffect, useState, useCallback } from "react";
import type { SwitchoverEntry } from "@/lib/types";

const STORAGE_KEY = "nikolator.switchoverLog.v1";
const MAX_ENTRIES = 100;

export function useSwitchoverLog() {
  const [entries, setEntries] = useState<SwitchoverEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      // ignore parse errors
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

  const add = useCallback((entry: Omit<SwitchoverEntry, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setEntries((prev) => [{ ...entry, id }, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove, hydrated };
}

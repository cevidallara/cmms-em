"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nikolator.repairCentros.v1";

type Map = Record<string, string>; // repairId → centroId

export function useRepairCentros() {
  const [map, setMap] = useState<Map>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setMap(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }, [map, hydrated]);

  const assign = useCallback((repairId: string, centroId: string) => {
    setMap((prev) => ({ ...prev, [repairId]: centroId }));
  }, []);

  const unassign = useCallback((repairId: string) => {
    setMap((prev) => {
      const next = { ...prev };
      delete next[repairId];
      return next;
    });
  }, []);

  const removeCentro = useCallback((centroId: string) => {
    setMap((prev) => {
      const next: Map = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v !== centroId) next[k] = v;
      }
      return next;
    });
  }, []);

  const repairsOf = useCallback(
    (centroId: string) => Object.keys(map).filter((rid) => map[rid] === centroId),
    [map]
  );

  const centroOf = useCallback((repairId: string) => map[repairId], [map]);

  return { map, assign, unassign, removeCentro, repairsOf, centroOf, hydrated };
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Anomaly, AnomalyCounts, AnomalyStatus } from "@/lib/types";

export function useAnomalies(opts: { status?: AnomalyStatus; includeAll?: boolean } = {}) {
  return useQuery({
    queryKey: ["anomalies", opts.status ?? null, opts.includeAll ?? false],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (opts.status) params.set("status", opts.status);
      if (opts.includeAll) params.set("includeAll", "true");
      const { data } = await api.get<Anomaly[]>(`/anomalies?${params.toString()}`);
      return data;
    },
  });
}

export function useAnomalyCounts() {
  return useQuery({
    queryKey: ["anomalies", "counts"],
    queryFn: async () => {
      const { data } = await api.get<AnomalyCounts>("/anomalies/counts");
      return data;
    },
    refetchOnWindowFocus: true,
  });
}

function makeStatusMutation(action: "ack" | "resolve" | "false-positive") {
  return function useStatusMutation() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const { data } = await api.post<Anomaly>(`/anomalies/${id}/${action}`);
        return data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["anomalies"] });
      },
    });
  };
}

export const useAckAnomaly = makeStatusMutation("ack");
export const useResolveAnomaly = makeStatusMutation("resolve");
export const useMarkFalsePositive = makeStatusMutation("false-positive");

export function useScanAnomalies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ motoresEvaluados: number; anomaliasCreadas: number }>(
        "/anomalies/scan"
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}

export function useRegenerateNarration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/anomalies/${id}/narrate`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Reading, ReadingInput } from "@/lib/types";

export function useReadings(params?: { assetId?: string }) {
  return useQuery({
    queryKey: ["readings", params],
    queryFn: async () => {
      const { data } = await api.get<Reading[]>("/readings", { params });
      return data;
    },
  });
}

export function useCreateReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReadingInput) => {
      const { data } = await api.post<Reading>("/readings", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["readings"] });
    },
  });
}

export function useDeleteReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/readings/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["readings"] });
    },
  });
}

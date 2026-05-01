"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Sensor, SensorInput } from "@/lib/types";

export function useSensors(params?: { assetId?: string }) {
  return useQuery({
    queryKey: ["sensors", params],
    queryFn: async () => {
      const { data } = await api.get<Sensor[]>("/sensors", { params });
      return data;
    },
  });
}

export function useCreateSensor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SensorInput) => {
      const { data } = await api.post<Sensor>("/sensors", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sensors"] });
    },
  });
}

export function useDeleteSensor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sensors/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sensors"] });
    },
  });
}

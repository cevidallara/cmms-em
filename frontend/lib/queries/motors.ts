"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Asset, AssetInput } from "@/lib/types";

export function useMotors() {
  return useQuery({
    queryKey: ["motors"],
    queryFn: async () => {
      const { data } = await api.get<Asset[]>("/assets");
      return data;
    },
  });
}

export function useMotor(id: string | undefined) {
  return useQuery({
    queryKey: ["motors", id],
    queryFn: async () => {
      const { data } = await api.get<Asset>(`/assets/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMotor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssetInput) => {
      const { data } = await api.post<Asset>("/assets", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motors"] });
    },
  });
}

export function useUpdateMotor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AssetInput>) => {
      const { data } = await api.put<Asset>(`/assets/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["motors"] });
      qc.setQueryData(["motors", id], data);
    },
  });
}

export function useDeleteMotor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motors"] });
    },
  });
}

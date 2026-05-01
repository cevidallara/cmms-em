"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Repair, RepairInput } from "@/lib/types";

export function useRepairs() {
  return useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data } = await api.get<Repair[]>("/repairs");
      return data;
    },
  });
}

export function useRepair(id: string | undefined) {
  return useQuery({
    queryKey: ["repairs", id],
    queryFn: async () => {
      const { data } = await api.get<Repair>(`/repairs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRepair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RepairInput) => {
      const { data } = await api.post<Repair>("/repairs", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
    },
  });
}

export function useUpdateRepair(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<RepairInput>) => {
      const { data } = await api.put<Repair>(`/repairs/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.setQueryData(["repairs", id], data);
    },
  });
}

export function useDeleteRepair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/repairs/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiKey, ApiKeyCreated, ApiKeyInput } from "@/lib/types";

export function useApiKeys() {
  return useQuery({
    queryKey: ["apikeys"],
    queryFn: async () => {
      const { data } = await api.get<ApiKey[]>("/apikeys");
      return data;
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApiKeyInput) => {
      const { data } = await api.post<ApiKeyCreated>("/apikeys", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apikeys"] });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiKey>(`/apikeys/${id}/revoke`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apikeys"] });
    },
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/apikeys/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apikeys"] });
    },
  });
}

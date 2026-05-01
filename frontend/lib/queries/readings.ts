"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Reading } from "@/lib/types";

export function useReadings(params?: { assetId?: string }) {
  return useQuery({
    queryKey: ["readings", params],
    queryFn: async () => {
      const { data } = await api.get<Reading[]>("/readings", { params });
      return data;
    },
  });
}

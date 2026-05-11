"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { MotorAdvice } from "@/lib/types";

type AdviceResponse = { advice: MotorAdvice; cached: boolean; computedAt: string };

/**
 * Mutation porque la generación es side-effecting (call al LLM con costo).
 * El cache lo manejamos con queryClient.setQueryData(['advice', motorId]).
 */
export function useMotorAdvice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ motorId, force }: { motorId: string; force?: boolean }) => {
      const { data } = await api.post<AdviceResponse>(
        `/ai/advise/motor/${motorId}`,
        force ? { force: true } : {}
      );
      return data;
    },
    onSuccess: (data, vars) => {
      qc.setQueryData(["advice", vars.motorId], data.advice);
    },
  });
}

export function useCachedAdvice(motorId: string): MotorAdvice | undefined {
  const qc = useQueryClient();
  return qc.getQueryData<MotorAdvice>(["advice", motorId]);
}

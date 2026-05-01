"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GaugeCircle } from "lucide-react";
import { useReadings } from "@/lib/queries/readings";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LecturasPage() {
  const readingsQuery = useReadings();

  const sorted = useMemo(() => {
    return [...(readingsQuery.data ?? [])].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [readingsQuery.data]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Datos"
        title="Lecturas"
        description="Registro histórico de mediciones de consumo, voltaje, corriente y eficiencia."
      />

      {readingsQuery.isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : readingsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar las lecturas"
          message={(readingsQuery.error as Error).message}
          onRetry={() => readingsQuery.refetch()}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<GaugeCircle size={20} />}
          title="Aún no hay lecturas"
          description="Las lecturas se cargan desde el detalle de cada motor."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border">
                <tr className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  <th className="px-5 py-3 font-normal">Fecha</th>
                  <th className="px-5 py-3 font-normal">Motor</th>
                  <th className="px-5 py-3 text-right font-normal">Consumo</th>
                  <th className="px-5 py-3 text-right font-normal">Voltaje</th>
                  <th className="px-5 py-3 text-right font-normal">Corriente</th>
                  <th className="px-5 py-3 text-right font-normal">Horas</th>
                  <th className="px-5 py-3 text-right font-normal">Eficiencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((r) => {
                  const motorName =
                    typeof r.assetId === "object" && r.assetId ? r.assetId.nombre : "Motor desconocido";
                  const motorId =
                    typeof r.assetId === "object" && r.assetId ? r.assetId._id : null;
                  return (
                    <tr key={r._id} className="hover:bg-elev/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-text-muted">
                        {fmtDate(r.fecha)}
                      </td>
                      <td className="px-5 py-3">
                        {motorId ? (
                          <Link
                            href={`/motores/${motorId}`}
                            className="text-text hover:text-volt"
                          >
                            {motorName}
                          </Link>
                        ) : (
                          <span className="text-text">{motorName}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {r.consumoEnergia?.toFixed(1) ?? "—"}
                        {r.consumoEnergia != null && (
                          <span className="ml-0.5 text-[10px] text-text-dim">kWh</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text-muted">
                        {r.voltaje ?? "—"}
                        {r.voltaje != null && <span className="ml-0.5 text-[10px] text-text-dim">V</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text-muted">
                        {r.corriente ?? "—"}
                        {r.corriente != null && <span className="ml-0.5 text-[10px] text-text-dim">A</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text-muted">
                        {r.horasOperacion ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text-muted">
                        {r.eficienciaEstimada != null ? `${r.eficienciaEstimada.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-text-dim">
            {sorted.length} lectura{sorted.length === 1 ? "" : "s"}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

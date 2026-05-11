"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Boxes, Sparkles } from "lucide-react";
import { useMotors, useDeleteMotor } from "@/lib/queries/motors";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { StatusDot, toneFromEstado } from "@/components/motor/StatusDot";

export default function MotoresPage() {
  const motorsQuery = useMotors();
  const deleteMotor = useDeleteMotor();
  const [q, setQ] = useState("");
  const [showBackups, setShowBackups] = useState<"all" | "primary" | "backup">("all");

  const filtered = useMemo(() => {
    const list = motorsQuery.data ?? [];
    return list.filter((m) => {
      if (showBackups === "primary" && m.esBackup) return false;
      if (showBackups === "backup" && !m.esBackup) return false;
      if (!q) return true;
      const needle = q.toLowerCase();
      return [m.nombre, m.tipo, m.marca, m.modelo, m.cliente, m.sector, m.ubicacion]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [motorsQuery.data, q, showBackups]);

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el motor "${nombre}"? Esta acción no se puede deshacer.`)) return;
    deleteMotor.mutate(id);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Flota"
        title="Motores"
        description="Inventario completo de motores eléctricos, bombas y compresores."
        actions={
          <div className="flex gap-2">
            <Link href="/motores/importar">
              <Button size="md" variant="secondary" iconLeft={<Sparkles size={14} />}>
                Importar con IA
              </Button>
            </Link>
            <Link href="/motores/nuevo">
              <Button size="md" iconLeft={<Plus size={14} />}>
                Nuevo motor
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, marca, sector…"
            className="block w-full rounded-lg border border-border bg-elev/60 py-2 pl-9 pr-3 text-[14px] text-text placeholder:text-text-dim outline-none focus:border-volt/50 focus:ring-2 focus:ring-volt/15"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-elev/40 p-1">
          {[
            { v: "all", l: "Todos" },
            { v: "primary", l: "Principales" },
            { v: "backup", l: "Backups" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setShowBackups(opt.v as typeof showBackups)}
              className={`rounded-md px-3 py-1 text-[12px] transition-colors ${
                showBackups === opt.v
                  ? "bg-elev text-text"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {motorsQuery.isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : motorsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar los motores"
          message={(motorsQuery.error as Error).message}
          onRetry={() => motorsQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Boxes size={20} />}
          title={
            (motorsQuery.data?.length ?? 0) === 0
              ? "Aún no hay motores cargados"
              : "Sin resultados"
          }
          description={
            (motorsQuery.data?.length ?? 0) === 0
              ? "Empieza por agregar el primer motor de tu flota."
              : "Ajusta los filtros o el término de búsqueda."
          }
          action={
            (motorsQuery.data?.length ?? 0) === 0 && (
              <Link href="/motores/nuevo">
                <Button iconLeft={<Plus size={14} />}>Crear primer motor</Button>
              </Link>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border">
                <tr className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  <th className="px-5 py-3 font-normal">Motor</th>
                  <th className="px-5 py-3 font-normal">Tipo</th>
                  <th className="px-5 py-3 font-normal">Planta / Sector</th>
                  <th className="px-5 py-3 text-right font-normal">Potencia</th>
                  <th className="px-5 py-3 font-normal">Estado</th>
                  <th className="px-5 py-3 text-right font-normal" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => {
                  const tone = toneFromEstado(m.estadoActual);
                  return (
                    <tr key={m._id} className="hover:bg-elev/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/motores/${m._id}`} className="block">
                          <div className="text-text font-medium">{m.nombre}</div>
                          <div className="font-mono text-[11px] text-text-dim">
                            {[m.marca, m.modelo].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-border bg-bg/40 px-2 py-0.5 font-mono text-[11px] text-text-muted">
                          {m.tipo}
                        </span>
                        {m.esBackup && (
                          <span className="ml-1.5 rounded-md border border-arc/30 bg-arc/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-arc">
                            backup
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-text">{m.cliente}</div>
                        <div className="text-[11px] text-text-dim">
                          {[m.sector, m.ubicacion].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-text">
                        {m.potenciaKW != null ? (
                          <>
                            {m.potenciaKW}
                            <span className="ml-0.5 text-[11px] text-text-dim">kW</span>
                          </>
                        ) : (
                          <span className="text-text-dim">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusDot
                          tone={tone}
                          label={m.estadoActual ?? "—"}
                          pulse={tone === "running"}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/motores/${m._id}/editar`}
                            className="grid h-8 w-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-text"
                            aria-label="Editar"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(m._id, m.nombre)}
                            className="grid h-8 w-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-danger"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-[11px] text-text-dim">
            <span>{filtered.length} motor{filtered.length === 1 ? "" : "es"}</span>
            <span>Total flota: {motorsQuery.data?.length ?? 0}</span>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

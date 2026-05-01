"use client";

import { useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  useRepairs,
  useCreateRepair,
  useUpdateRepair,
  useDeleteRepair,
} from "@/lib/queries/repairs";
import { PROGRESOS, type Progreso, type Repair } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { RepairCard } from "@/components/repair/RepairCard";
import { RepairForm } from "@/components/repair/RepairForm";

const columnHints: Record<Progreso, string> = {
  Ingresado: "Recién creadas, esperando asignación",
  "En Taller": "Diagnóstico o reparación en curso",
  "Para despachar": "Listas para devolución",
  Despachado: "Cerradas y devueltas",
};

export default function ReparacionesPage() {
  const repairsQuery = useRepairs();
  const createRepair = useCreateRepair();
  const deleteRepair = useDeleteRepair();
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Repair | null>(null);

  const updateRepair = useUpdateRepair(editing?._id ?? "");

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta reparación?")) return;
    await deleteRepair.mutateAsync(id);
    setEditing(null);
  };

  const grouped = (repairsQuery.data ?? []).reduce(
    (acc, r) => {
      const col = (r.progreso ?? "Ingresado") as Progreso;
      acc[col] = acc[col] ?? [];
      acc[col].push(r);
      return acc;
    },
    {} as Record<Progreso, Repair[]>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Servicio"
        title="Reparaciones"
        description="Kanban del flujo completo: ingreso, taller, despacho y cierre."
        actions={
          <Button iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
            Nueva reparación
          </Button>
        }
      />

      {repairsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-elev/40 p-4 backdrop-blur-xl">
              <Skeleton className="h-3 w-20" />
              <div className="mt-3 space-y-2">
                {[...Array(3)].map((__, j) => (
                  <div key={j} className="rounded-xl border border-border bg-bg/40 p-3 space-y-2">
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : repairsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar las reparaciones"
          message={(repairsQuery.error as Error).message}
          onRetry={() => repairsQuery.refetch()}
        />
      ) : (repairsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Wrench size={20} />}
          title="No hay reparaciones registradas"
          description="Crea la primera para empezar a usar el flujo."
          action={
            <Button iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
              Nueva reparación
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROGRESOS.map((col) => {
            const items = grouped[col] ?? [];
            return (
              <Card key={col} className="flex flex-col p-4">
                <div className="mb-1 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    <span className="mr-2 inline-block h-1 w-1 rounded-full bg-volt align-middle" />
                    {col}
                  </div>
                  <span className="rounded-md border border-border bg-bg/40 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                    {items.length}
                  </span>
                </div>
                <div className="text-[10px] text-text-dim">{columnHints[col]}</div>
                <div className="mt-3 flex-1 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((r) => (
                      <RepairCard key={r._id} repair={r} onClick={() => setEditing(r)} />
                    ))}
                  </AnimatePresence>
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-bg/30 px-3 py-6 text-center text-[11px] text-text-dim">
                      sin items
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Nueva reparación"
        size="md"
      >
        <RepairForm
          onSubmit={(input) => createRepair.mutateAsync(input)}
          onSuccess={() => setOpenCreate(false)}
          submitLabel="Crear reparación"
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Reparación #${editing._id.slice(-5)}` : ""}
        size="md"
      >
        {editing && (
          <div className="space-y-4">
            <RepairForm
              initial={editing}
              onSubmit={(input) => updateRepair.mutateAsync(input)}
              onSuccess={() => setEditing(null)}
              submitLabel="Guardar cambios"
            />
            <div className="flex justify-end border-t border-border pt-3">
              <Button
                variant="ghost"
                iconLeft={<Trash2 size={14} />}
                onClick={() => handleDelete(editing._id)}
              >
                Eliminar reparación
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

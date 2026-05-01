"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Pencil, Plus, Star, Trash2, Wrench, MapPin, Mail, Phone } from "lucide-react";
import { useCentros } from "@/lib/hooks/useCentros";
import { useRepairCentros } from "@/lib/hooks/useRepairCentros";
import { useRepairs } from "@/lib/queries/repairs";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { CentroAvatar } from "@/components/centro/CentroAvatar";
import { CentroForm } from "@/components/centro/CentroForm";
import { AssignRepairsModal } from "@/components/centro/AssignRepairsModal";
import { PrioridadBadge } from "@/components/repair/PrioridadBadge";
import type { CentroServicio } from "@/lib/types";

export default function CentrosPage() {
  const centros = useCentros();
  const repairCentros = useRepairCentros();
  const repairsQuery = useRepairs();
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<CentroServicio | null>(null);
  const [assigning, setAssigning] = useState<CentroServicio | null>(null);

  const stats = useMemo(() => {
    const totalCentros = centros.entries.length;
    const totalAsignadas = Object.keys(repairCentros.map).length;
    const ratings = centros.entries.map((c) => c.rating ?? 0).filter((r) => r > 0);
    const ratingPromedio = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
    const especialidades = new Set(
      centros.entries.map((c) => c.especialidad).filter(Boolean)
    ).size;
    return { totalCentros, totalAsignadas, ratingPromedio, especialidades };
  }, [centros.entries, repairCentros.map]);

  const handleDelete = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el centro "${nombre}"? Las reparaciones asignadas quedarán libres.`)) return;
    centros.remove(id);
    repairCentros.removeCentro(id);
  };

  if (!centros.hydrated || repairsQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={24} className="text-volt" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servicio externo"
        title="Centros de servicio"
        description="Tu red de partners externos para reparaciones especializadas."
        actions={
          <Button iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
            Nuevo centro
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Centros" value={stats.totalCentros.toString()} hint={`${stats.especialidades} especialidad${stats.especialidades === 1 ? "" : "es"}`} />
        <Stat
          label="Reparaciones asignadas"
          value={stats.totalAsignadas.toString()}
          hint={`de ${repairsQuery.data?.length ?? 0} totales`}
        />
        <Stat
          label="Rating promedio"
          value={stats.ratingPromedio > 0 ? stats.ratingPromedio.toFixed(1) : "—"}
          unit={stats.ratingPromedio > 0 ? "/ 5" : ""}
          hint={stats.ratingPromedio >= 4.5 ? "red de alta calidad" : "red en evaluación"}
        />
        <Stat
          label="Capacidad histórica"
          value={centros.entries.reduce((s, c) => s + (c.reparacionesCompletadas ?? 0), 0).toString()}
          hint="reparaciones completadas"
        />
      </div>

      {centros.entries.length === 0 ? (
        <EmptyState
          icon={<Building2 size={20} />}
          title="Aún no hay centros de servicio"
          description="Suma tus partners de reparación externos para distribuir el trabajo."
          action={
            <Button iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
              Agregar primer centro
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {centros.entries.map((c, i) => {
            const repairIds = repairCentros.repairsOf(c.id);
            const repairs = (repairsQuery.data ?? []).filter((r) => repairIds.includes(r._id));
            const enCurso = repairs.filter((r) => r.progreso !== "Despachado").length;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <Card elevated className="p-5">
                  <div className="flex items-start gap-3">
                    <CentroAvatar nombre={c.nombre} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium text-text">
                        {c.nombre}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {c.rating != null && c.rating > 0 && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-volt">
                            <Star size={10} fill="currentColor" />
                            {c.rating.toFixed(1)}
                          </span>
                        )}
                        {c.especialidad && (
                          <span className="rounded-md border border-border bg-bg/40 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                            {c.especialidad}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditing(c)}
                        className="grid h-7 w-7 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-text"
                        aria-label="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.nombre)}
                        className="grid h-7 w-7 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-danger"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-[12px] text-text-muted">
                    {c.ubicacion && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-text-dim" />
                        {c.ubicacion}
                      </div>
                    )}
                    {c.contacto && (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={11} className="text-text-dim" />
                        {c.contacto}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={11} className="text-text-dim" />
                        <a href={`mailto:${c.email}`} className="hover:text-text">{c.email}</a>
                      </div>
                    )}
                    {c.telefono && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-text-dim" />
                        {c.telefono}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-bg/40 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-text-dim">En curso</div>
                      <div className="mt-0.5 font-mono text-base text-text">{enCurso}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-bg/40 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-text-dim">Histórico</div>
                      <div className="mt-0.5 font-mono text-base text-text">
                        {c.reparacionesCompletadas ?? 0}
                      </div>
                    </div>
                  </div>

                  {repairs.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-text-dim">
                        Reparaciones aquí
                      </div>
                      <ul className="space-y-1">
                        {repairs.slice(0, 3).map((r) => {
                          const motorName =
                            typeof r.assetId === "object" && r.assetId
                              ? r.assetId.nombre
                              : "Motor";
                          return (
                            <li
                              key={r._id}
                              className="flex items-center justify-between gap-2 text-[12px]"
                            >
                              <span className="truncate text-text-muted">
                                <span className="font-mono text-[10px] text-text-dim">
                                  #{r._id.slice(-5)}
                                </span>{" "}
                                {motorName}
                              </span>
                              <PrioridadBadge prioridad={r.prioridad} />
                            </li>
                          );
                        })}
                        {repairs.length > 3 && (
                          <li className="text-[11px] text-text-dim">
                            +{repairs.length - 3} más
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    fullWidth
                    iconLeft={<Wrench size={13} />}
                    onClick={() => setAssigning(c)}
                    className="mt-4"
                  >
                    Asignar reparaciones
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Nuevo centro de servicio"
        description="Registra un partner externo de tu red"
      >
        <CentroForm
          onSubmit={(input) => {
            centros.add(input);
            setOpenCreate(false);
          }}
          onCancel={() => setOpenCreate(false)}
          submitLabel="Crear centro"
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Editar ${editing.nombre}` : ""}
      >
        {editing && (
          <CentroForm
            initial={editing}
            onSubmit={(input) => {
              centros.update(editing.id, input);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <AssignRepairsModal
        centro={assigning}
        centroOf={repairCentros.centroOf}
        onAssign={repairCentros.assign}
        onUnassign={repairCentros.unassign}
        onClose={() => setAssigning(null)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-[10px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold text-text">{value}</span>
        {unit && <span className="text-[12px] text-text-dim">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[12px] text-text-dim">{hint}</div>}
    </Card>
  );
}

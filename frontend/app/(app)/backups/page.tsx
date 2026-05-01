"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Repeat2, Shield, ShieldAlert, Trash2, ArrowRight } from "lucide-react";
import { useMotors, useUpdateMotor } from "@/lib/queries/motors";
import { useSwitchoverLog } from "@/lib/hooks/useSwitchoverLog";
import { buildBackupPairs, summarizeBackups } from "@/lib/utils/backups";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { KpiSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { AssignBackupModal } from "@/components/backup/AssignBackupModal";
import { SwitchoverModal } from "@/components/backup/SwitchoverModal";
import type { Asset, EstadoBackup } from "@/lib/types";

const ESTADOS: EstadoBackup[] = ["Disponible", "Reservado", "En Uso"];

const estadoStyles: Record<EstadoBackup, { bg: string; text: string; border: string; pulse?: boolean }> = {
  Disponible: { bg: "bg-success/10", text: "text-success", border: "border-success/30" },
  Reservado:  { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" },
  "En Uso":   { bg: "bg-spark/10",   text: "text-spark",   border: "border-spark/30", pulse: true },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "ahora";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export default function BackupsPage() {
  const motorsQuery = useMotors();
  const log = useSwitchoverLog();
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null);
  const [openSwitchover, setOpenSwitchover] = useState(false);

  const { pairs, freeBackups } = useMemo(
    () => buildBackupPairs(motorsQuery.data ?? []),
    [motorsQuery.data]
  );
  const stats = useMemo(
    () => summarizeBackups(motorsQuery.data ?? []),
    [motorsQuery.data]
  );

  if (motorsQuery.isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
        </div>
        <div className="rounded-2xl border border-border bg-elev/40 p-5 backdrop-blur-xl space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </PageContainer>
    );
  }

  if (motorsQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          title="No pudimos cargar los backups"
          message={(motorsQuery.error as Error).message}
          onRetry={() => motorsQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if ((motorsQuery.data?.length ?? 0) === 0) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Continuidad"
          title="Backups"
          description="Mapeo primary → backup, switchovers y disponibilidad de respaldo."
        />
        <EmptyState
          icon={<Repeat2 size={20} />}
          title="Aún no hay motores"
          description="Crea motores principales y de respaldo para gestionar la continuidad."
          action={
            <Link href="/motores/nuevo">
              <Button>Crear primer motor</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Continuidad"
        title="Backups"
        description="Cada motor crítico, con su plan B controlado."
        actions={
          <Button
            iconLeft={<Repeat2 size={14} />}
            onClick={() => setOpenSwitchover(true)}
            disabled={pairs.filter((p) => p.backup).length === 0}
          >
            Registrar switchover
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Equipos cubiertos"
          value={`${stats.withBackup}`}
          unit={`/ ${stats.totalPrimaries}`}
          hint="motores principales con respaldo"
          tone={stats.withoutBackup === 0 ? "good" : undefined}
        />
        <Stat
          label="Sin respaldo"
          value={stats.withoutBackup.toString()}
          hint={stats.withoutBackup === 0 ? "todos cubiertos" : "asignar antes de fallar"}
          tone={stats.withoutBackup > 0 ? "warning" : "good"}
        />
        <Stat
          label="Backups en uso"
          value={stats.enUso.toString()}
          hint={`${stats.totalBackups} backups totales`}
          tone={stats.enUso > 0 ? "active" : undefined}
        />
        <Stat
          label="Disponibilidad de respaldo"
          value={`${stats.disponibilidadPct.toFixed(1)}`}
          unit="%"
          hint={`${stats.disponibles} disponibles ahora`}
          tone={stats.disponibilidadPct >= 80 ? "good" : "warning"}
        />
      </div>

      <Card elevated className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-text">Mapeo primary → backup</div>
            <div className="text-[11px] text-text-dim">
              {stats.totalPrimaries} motor{stats.totalPrimaries === 1 ? "" : "es"} principal
              {stats.totalPrimaries === 1 ? "" : "es"} · {stats.totalBackups} backup
              {stats.totalBackups === 1 ? "" : "s"}
            </div>
          </div>
          {freeBackups.length > 0 && (
            <span className="rounded-md border border-border bg-bg/40 px-2 py-1 font-mono text-[10px] text-text-muted">
              {freeBackups.length} backup{freeBackups.length === 1 ? "" : "s"} libre{freeBackups.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {pairs.map((pair, i) => (
            <BackupRow
              key={pair.primary._id}
              primary={pair.primary}
              backup={pair.backup}
              i={i}
              onAssign={() => setAssignTarget(pair.primary)}
              freeBackupsExist={freeBackups.length > 0}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-medium text-text">Log de switchovers</div>
          <span className="font-mono text-[10px] text-text-dim">
            {log.entries.length} evento{log.entries.length === 1 ? "" : "s"} · mock local
          </span>
        </div>

        {!log.hydrated ? (
          <div className="flex justify-center py-6">
            <Spinner size={16} className="text-text-dim" />
          </div>
        ) : log.entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-bg/30 px-4 py-8 text-center text-[12px] text-text-dim">
            Sin eventos registrados. Usa "Registrar switchover" para añadir uno.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {log.entries.map((e) => {
              const primary = (motorsQuery.data ?? []).find((m) => m._id === e.primaryId);
              const backup = (motorsQuery.data ?? []).find((m) => m._id === e.backupId);
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-elev-2 text-text-muted">
                    <Repeat2 size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13px] text-text">
                      <span>{primary?.nombre ?? "Motor eliminado"}</span>
                      <ArrowRight size={11} className="text-text-dim" />
                      <span>{backup?.nombre ?? "Backup eliminado"}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-text-dim">
                      <span>{fmtDate(e.fecha)}</span>
                      <span>·</span>
                      <span>{e.motivo}</span>
                      {e.duracionMin && (
                        <>
                          <span>·</span>
                          <span>{e.duracionMin} min</span>
                        </>
                      )}
                    </div>
                    {e.notas && (
                      <div className="mt-1 text-[11px] text-text-muted">{e.notas}</div>
                    )}
                  </div>
                  <button
                    onClick={() => log.remove(e.id)}
                    className="grid h-8 w-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-danger"
                    aria-label="Eliminar evento"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AssignBackupModal
        primary={assignTarget}
        freeBackups={freeBackups}
        onClose={() => setAssignTarget(null)}
      />

      <SwitchoverModal
        open={openSwitchover}
        onClose={() => setOpenSwitchover(false)}
        onSubmit={(entry) => log.add(entry)}
      />
    </PageContainer>
  );
}

function BackupRow({
  primary,
  backup,
  i,
  onAssign,
  freeBackupsExist,
}: {
  primary: Asset;
  backup: Asset | null;
  i: number;
  onAssign: () => void;
  freeBackupsExist: boolean;
}) {
  const updateBackup = useUpdateMotor(backup?._id ?? "");
  const updateUnassign = useUpdateMotor(backup?._id ?? "");
  const enUso = backup?.estadoBackup === "En Uso";
  const status = backup?.estadoBackup ?? "Disponible";
  const styles = backup ? estadoStyles[status as EstadoBackup] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.4) }}
      className={`grid grid-cols-12 items-center gap-3 rounded-xl border px-4 py-3.5 ${
        backup
          ? enUso
            ? "border-spark/30 bg-spark/5"
            : "border-border bg-bg/40"
          : "border-warning/20 bg-warning/5"
      }`}
    >
      <div className="col-span-4 min-w-0">
        <Link href={`/motores/${primary._id}`} className="block">
          <div className="truncate text-[13px] font-medium text-text">{primary.nombre}</div>
          <div className="font-mono text-[10px] text-text-dim">
            {primary.tipo}
            {primary.potenciaKW ? ` · ${primary.potenciaKW} kW` : ""}
            {primary.cliente ? ` · ${primary.cliente}` : ""}
          </div>
        </Link>
      </div>

      <div className="col-span-3 flex items-center gap-2">
        <div className="relative h-px flex-1 bg-gradient-to-r from-text-dim/30 via-spark/40 to-text-dim/30">
          {enUso && (
            <motion.span
              initial={{ x: "-20%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-spark shadow-[0_0_8px_2px_rgba(0,229,255,0.6)]"
            />
          )}
        </div>
        <ArrowRight size={11} className="shrink-0 text-text-dim" />
      </div>

      <div className="col-span-3 min-w-0">
        {backup ? (
          <Link href={`/motores/${backup._id}`} className="block">
            <div className="truncate text-[13px] text-text">{backup.nombre}</div>
            <div className="font-mono text-[10px] text-text-dim">
              {backup.potenciaKW ? `${backup.potenciaKW} kW` : "—"}
            </div>
          </Link>
        ) : (
          <div className="text-[12px] text-warning">Sin respaldo asignado</div>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-end gap-2">
        {backup && styles ? (
          <>
            <select
              value={status}
              onChange={(e) => updateBackup.mutate({ estadoBackup: e.target.value as EstadoBackup })}
              className={`rounded-full border ${styles.border} ${styles.bg} px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${styles.text} appearance-none focus:outline-none focus:ring-2 focus:ring-volt/20 cursor-pointer`}
              style={{ paddingRight: "1rem" }}
              aria-label="Cambiar estado del backup"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s} className="bg-elev text-text">
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!confirm(`¿Quitar la asignación de ${backup.nombre} a ${primary.nombre}?`)) return;
                updateUnassign.mutate({ activoRelacionado: undefined });
              }}
              className="grid h-7 w-7 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-danger"
              aria-label="Quitar asignación"
            >
              <Trash2 size={12} />
            </button>
          </>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            iconLeft={<Plus size={12} />}
            onClick={onAssign}
            disabled={!freeBackupsExist}
          >
            {freeBackupsExist ? "Asignar" : "Sin libres"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "good" | "warning" | "active";
}) {
  const valueClass =
    tone === "good"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : tone === "active"
      ? "text-spark"
      : "text-text";
  const Icon = tone === "warning" ? ShieldAlert : tone === "good" ? Shield : null;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-[10px] uppercase tracking-wider text-text-dim">{label}</div>
        {Icon && <Icon size={14} className={tone === "warning" ? "text-warning" : "text-success"} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-semibold ${valueClass}`}>{value}</span>
        {unit && <span className="text-[12px] text-text-dim">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[12px] text-text-dim">{hint}</div>}
    </Card>
  );
}

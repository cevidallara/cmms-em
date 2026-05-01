import type { Asset } from "@/lib/types";

export type BackupPair = {
  primary: Asset;
  backup: Asset | null;
};

export function getActivoRelacionadoId(a: Asset): string | undefined {
  if (!a.activoRelacionado) return undefined;
  return typeof a.activoRelacionado === "string"
    ? a.activoRelacionado
    : a.activoRelacionado._id;
}

export function buildBackupPairs(motors: Asset[]): {
  pairs: BackupPair[];
  unassigned: Asset[];
  freeBackups: Asset[];
} {
  const primaries = motors.filter((m) => !m.esBackup);
  const backups = motors.filter((m) => m.esBackup);

  const byPrimaryId = new Map<string, Asset>();
  for (const b of backups) {
    const pid = getActivoRelacionadoId(b);
    if (pid && !byPrimaryId.has(pid)) byPrimaryId.set(pid, b);
  }

  const pairs: BackupPair[] = primaries.map((p) => ({
    primary: p,
    backup: byPrimaryId.get(p._id) ?? null,
  }));

  const unassigned = pairs.filter((p) => !p.backup).map((p) => p.primary);
  const freeBackups = backups.filter((b) => !getActivoRelacionadoId(b));

  return { pairs, unassigned, freeBackups };
}

export type BackupSummary = {
  totalPrimaries: number;
  withBackup: number;
  withoutBackup: number;
  enUso: number;
  disponibles: number;
  totalBackups: number;
  disponibilidadPct: number;
};

export function summarizeBackups(motors: Asset[]): BackupSummary {
  const { pairs } = buildBackupPairs(motors);
  const backups = motors.filter((m) => m.esBackup);
  const enUso = backups.filter((b) => b.estadoBackup === "En Uso").length;
  const disponibles = backups.filter((b) => b.estadoBackup === "Disponible" || !b.estadoBackup).length;
  const withBackup = pairs.filter((p) => !!p.backup).length;
  const totalBackups = backups.length;
  const disponibilidadPct = totalBackups > 0 ? Math.round((disponibles / totalBackups) * 1000) / 10 : 0;

  return {
    totalPrimaries: pairs.length,
    withBackup,
    withoutBackup: pairs.length - withBackup,
    enUso,
    disponibles,
    totalBackups,
    disponibilidadPct,
  };
}

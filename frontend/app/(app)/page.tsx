"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMotors } from "@/lib/queries/motors";
import { useReadings } from "@/lib/queries/readings";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KpiSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { StatusDot, toneFromEstado } from "@/components/motor/StatusDot";
import type { Asset, Reading } from "@/lib/types";

function MiniSpark({ values, tone = "running" }: { values: number[]; tone?: "running" | "alert" | "standby" }) {
  if (!values.length) {
    return (
      <div className="flex h-5 items-center text-[10px] text-text-dim">sin lecturas</div>
    );
  }
  const W = 90, H = 22;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const path = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * W;
      const y = H - ((v - min) / range) * (H - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke =
    tone === "alert" ? "#FF9F1C" : tone === "standby" ? "rgba(255,255,255,0.18)" : "#B5F500";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-5 w-full">
      <path d={path} stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function readingsByMotor(readings: Reading[]) {
  const map = new Map<string, Reading[]>();
  for (const r of readings) {
    const id = typeof r.assetId === "string" ? r.assetId : r.assetId?._id;
    if (!id) continue;
    const arr = map.get(id) ?? [];
    arr.push(r);
    map.set(id, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }
  return map;
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const motorsQuery = useMotors();
  const readingsQuery = useReadings();

  const motors = motorsQuery.data ?? [];
  const readings = readingsQuery.data ?? [];

  const grouped = useMemo(() => readingsByMotor(readings), [readings]);

  const kpis = useMemo(() => {
    const total = motors.length;
    const running = motors.filter((m) => m.estadoActual === "Operativo").length;
    const avail = total > 0 ? Math.round((running / total) * 1000) / 10 : 0;
    // Consumo agregado: suma de la última lectura de cada motor
    let consumo = 0;
    for (const arr of grouped.values()) {
      const last = arr[arr.length - 1];
      if (last?.consumoEnergia) consumo += last.consumoEnergia;
    }
    return { total, running, avail, consumo };
  }, [motors, grouped]);

  if (motorsQuery.isLoading) {
    return (
      <PageContainer>
        <div className="space-y-3 pb-6 border-b border-border">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      </PageContainer>
    );
  }

  if (motorsQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          title="No pudimos cargar la flota"
          message={(motorsQuery.error as Error).message}
          onRetry={() => motorsQuery.refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Dashboard"
        title={`Hola, ${usuario?.nombre} 👋`}
        description="Vista general de la flota y su consumo energético."
        actions={
          <Link href="/motores/nuevo">
            <Button iconLeft={<Plus size={14} />} size="md">
              Nuevo motor
            </Button>
          </Link>
        }
      />

      {motors.length === 0 ? (
        <WelcomeBanner hasMotors={false} hasReadings={readings.length > 0} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Kpi label="Motores" value={kpis.total.toString()} hint={`${kpis.running} operativos`} />
            <Kpi
              label="Disponibilidad"
              value={`${kpis.avail.toFixed(1)}`}
              unit="%"
              hint="motores operativos"
              positive={kpis.avail >= 90}
            />
            <Kpi
              label="Consumo agregado"
              value={kpis.consumo > 0 ? kpis.consumo.toFixed(0) : "—"}
              unit={kpis.consumo > 0 ? "kWh" : ""}
              hint={kpis.consumo > 0 ? "última lectura por motor" : "sin lecturas registradas"}
            />
            <Kpi
              label="Backups disponibles"
              value={motors.filter((m) => m.esBackup && m.estadoBackup === "Disponible").length.toString()}
              hint={`${motors.filter((m) => m.esBackup).length} backups totales`}
            />
          </div>

          <Card elevated className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-text">Vista de flota</div>
                <div className="text-[11px] text-text-dim">
                  {motors.length} motor{motors.length === 1 ? "" : "es"} · ordenados por estado
                </div>
              </div>
              <Link href="/motores" className="inline-flex items-center gap-1 text-[12px] text-text-muted transition-colors hover:text-text">
                Ver flota completa
                <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...motors]
                .sort((a, b) => (a.estadoActual === "En reparación" ? -1 : 0) - (b.estadoActual === "En reparación" ? -1 : 0))
                .slice(0, 9)
                .map((m) => (
                  <MotorCard key={m._id} motor={m} readings={grouped.get(m._id) ?? []} />
                ))}
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  positive,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-[10px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold text-text">{value}</span>
        {unit && <span className="text-[12px] text-text-dim">{unit}</span>}
      </div>
      {hint && (
        <div className={`mt-1 text-[12px] ${positive ? "text-success" : "text-text-dim"}`}>{hint}</div>
      )}
    </Card>
  );
}

function MotorCard({ motor, readings }: { motor: Asset; readings: Reading[] }) {
  const tone = toneFromEstado(motor.estadoActual);
  const sparkValues = readings
    .slice(-12)
    .map((r) => r.consumoEnergia ?? 0)
    .filter((v) => v >= 0);
  const last = readings[readings.length - 1];
  const sparkTone = tone === "alert" ? "alert" : tone === "standby" || tone === "offline" ? "standby" : "running";

  return (
    <Link
      href={`/motores/${motor._id}`}
      className="block rounded-xl border border-border bg-bg/40 p-3 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-text">{motor.nombre}</div>
          <div className="truncate text-[10px] text-text-dim">
            {[motor.cliente, motor.sector].filter(Boolean).join(" · ")}
          </div>
        </div>
        <StatusDot tone={tone} pulse={tone === "running"} />
      </div>
      <div className="mt-3">
        <MiniSpark values={sparkValues} tone={sparkTone} />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-sm text-text">
          {last?.consumoEnergia != null ? last.consumoEnergia.toFixed(1) : motor.potenciaKW ?? "—"}
          <span className="ml-0.5 text-[10px] text-text-dim">
            {last?.consumoEnergia != null ? "kWh" : motor.potenciaKW != null ? "kW" : ""}
          </span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {motor.estadoActual ?? "—"}
        </span>
      </div>
    </Link>
  );
}

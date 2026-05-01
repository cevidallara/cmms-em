"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ChevronLeft, Pencil, Plus, Wrench } from "lucide-react";
import { useMotor } from "@/lib/queries/motors";
import { useReadings, useCreateReading } from "@/lib/queries/readings";
import { useRepairs, useCreateRepair } from "@/lib/queries/repairs";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { StatusDot, toneFromEstado } from "@/components/motor/StatusDot";
import { ConsumptionChart } from "@/components/charts/ConsumptionChart";
import { SensorsCard } from "@/components/sensor/SensorsCard";
import { ReadingForm } from "@/components/reading/ReadingForm";
import { RepairForm } from "@/components/repair/RepairForm";
import { PrioridadBadge } from "@/components/repair/PrioridadBadge";
import type { Reading } from "@/lib/types";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MotorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const motorQuery = useMotor(id);
  const readingsQuery = useReadings();
  const repairsQuery = useRepairs();
  const createReading = useCreateReading();
  const createRepair = useCreateRepair();

  const [openReading, setOpenReading] = useState(false);
  const [openRepair, setOpenRepair] = useState(false);

  const myReadings = useMemo<Reading[]>(() => {
    return (readingsQuery.data ?? [])
      .filter((r) => {
        const aid = typeof r.assetId === "string" ? r.assetId : r.assetId?._id;
        return aid === id;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [readingsQuery.data, id]);

  const myRepairs = useMemo(() => {
    return (repairsQuery.data ?? [])
      .filter((r) => {
        const aid = typeof r.assetId === "string" ? r.assetId : r.assetId?._id;
        return aid === id;
      })
      .sort((a, b) =>
        new Date(b.fechaInicio ?? 0).getTime() - new Date(a.fechaInicio ?? 0).getTime()
      );
  }, [repairsQuery.data, id]);

  if (motorQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={24} className="text-volt" />
      </div>
    );
  }
  if (motorQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          title="No pudimos cargar el motor"
          message={(motorQuery.error as Error).message}
          onRetry={() => motorQuery.refetch()}
        />
      </PageContainer>
    );
  }
  if (!motorQuery.data) {
    return (
      <PageContainer>
        <ErrorState title="Motor no encontrado" message="Es posible que haya sido eliminado." />
      </PageContainer>
    );
  }

  const m = motorQuery.data;
  const tone = toneFromEstado(m.estadoActual);

  const lastReading = myReadings[myReadings.length - 1];
  const totalKwh = myReadings.reduce((sum, r) => sum + (r.consumoEnergia ?? 0), 0);
  const totalCosto = myReadings.reduce((sum, r) => sum + (r.costoEnergia ?? 0), 0);
  const lastEficiencia = lastReading?.eficienciaEstimada;

  return (
    <PageContainer>
      <Link
        href="/motores"
        className="inline-flex items-center gap-1.5 text-[12px] text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft size={14} /> Volver a la flota
      </Link>

      <PageHeader
        eyebrow={m.tipo}
        title={
          <span className="flex items-center gap-3">
            {m.nombre}
            <StatusDot tone={tone} label={m.estadoActual ?? "—"} pulse={tone === "running"} />
          </span>
        }
        description={[m.marca, m.modelo, m.numeroSerie].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <Button
              variant="secondary"
              iconLeft={<Wrench size={14} />}
              onClick={() => setOpenRepair(true)}
            >
              Reparación
            </Button>
            <Button iconLeft={<Plus size={14} />} onClick={() => setOpenReading(true)}>
              Lectura
            </Button>
            <Link href={`/motores/${m._id}/editar`}>
              <Button variant="ghost" iconLeft={<Pencil size={14} />}>
                Editar
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Potencia nominal"
          value={m.potenciaKW != null ? m.potenciaKW.toString() : "—"}
          unit="kW"
        />
        <Kpi
          label="Último consumo"
          value={lastReading?.consumoEnergia != null ? lastReading.consumoEnergia.toFixed(1) : "—"}
          unit="kWh"
          hint={lastReading ? fmtDate(lastReading.fecha) : "Sin lecturas"}
        />
        <Kpi
          label="Eficiencia"
          value={lastEficiencia != null ? lastEficiencia.toFixed(1) : "—"}
          unit="%"
          hint={lastReading?.claseIEActual ? `Clase ${lastReading.claseIEActual}` : "Sin clasificar"}
        />
        <Kpi
          label="Costo acumulado"
          value={totalCosto > 0 ? `$${totalCosto.toLocaleString("es-CL")}` : "—"}
          unit={lastReading?.moneda ?? "USD"}
          hint={`${myReadings.length} lectura${myReadings.length === 1 ? "" : "s"} · ${totalKwh.toFixed(0)} kWh`}
        />
      </div>

      <Card elevated className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-text">Consumo histórico</div>
            <div className="text-[11px] text-text-dim">
              {myReadings.length === 0
                ? "Aún no hay lecturas registradas"
                : `${myReadings.length} lectura${myReadings.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>
        <div className="h-52">
          <ConsumptionChart readings={myReadings} height={208} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 text-[13px] font-medium text-text">Lecturas recientes</div>
          {myReadings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-bg/30 px-4 py-8 text-center text-[12px] text-text-dim">
              Sin lecturas. Carga la primera para empezar a graficar consumo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-border">
                  <tr className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    <th className="px-2 py-2 font-normal">Fecha</th>
                    <th className="px-2 py-2 text-right font-normal">Consumo</th>
                    <th className="px-2 py-2 text-right font-normal">Voltaje</th>
                    <th className="px-2 py-2 text-right font-normal">Corriente</th>
                    <th className="px-2 py-2 text-right font-normal">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...myReadings].reverse().slice(0, 10).map((r) => (
                    <tr key={r._id}>
                      <td className="px-2 py-2 font-mono text-text-muted">{fmtDate(r.fecha)}</td>
                      <td className="px-2 py-2 text-right font-mono text-text">
                        {r.consumoEnergia?.toFixed(1) ?? "—"}
                        <span className="ml-0.5 text-[10px] text-text-dim">kWh</span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-text-muted">
                        {r.voltaje ?? "—"}
                        {r.voltaje && <span className="ml-0.5 text-[10px] text-text-dim">V</span>}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-text-muted">
                        {r.corriente ?? "—"}
                        {r.corriente && <span className="ml-0.5 text-[10px] text-text-dim">A</span>}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-text-muted">
                        {r.horasOperacion ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 text-[13px] font-medium text-text">Especificaciones</div>
          <dl className="space-y-2.5 text-[12px]">
            <Spec label="Tipo" value={m.tipo} />
            <Spec label="Marca" value={m.marca} />
            <Spec label="Modelo" value={m.modelo} />
            <Spec label="N° serie" value={m.numeroSerie} />
            <Spec label="Potencia" value={m.potenciaKW ? `${m.potenciaKW} kW` : undefined} />
            <Spec label="Planta" value={m.cliente} />
            <Spec label="Sector" value={m.sector} />
            <Spec label="Ubicación" value={m.ubicacion} />
            <Spec label="Proveedor" value={m.proveedor} />
            <Spec
              label="Costo"
              value={m.costo ? `$${m.costo.toLocaleString("es-CL")}` : undefined}
            />
            <Spec
              label="Adquirido"
              value={m.fechaAdquisicion ? new Date(m.fechaAdquisicion).toLocaleDateString("es-CL") : undefined}
            />
            <Spec
              label="Rol"
              value={m.esBackup ? `Backup (${m.estadoBackup ?? "Disponible"})` : "Principal"}
            />
          </dl>
        </Card>
      </div>

      <SensorsCard assetId={id} />

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-medium text-text">Reparaciones</div>
          <Link href="/reparaciones" className="text-[11px] text-text-muted hover:text-text">
            Ver todas →
          </Link>
        </div>
        {myRepairs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-bg/30 px-4 py-6 text-center text-[12px] text-text-dim">
            Sin reparaciones registradas para este motor.
          </div>
        ) : (
          <ul className="space-y-2">
            {myRepairs.slice(0, 5).map((r) => (
              <li
                key={r._id}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg/30 px-3 py-2.5"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  #{r._id.slice(-5)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-text">
                    {r.descripcion ?? "Sin descripción"}
                  </div>
                  <div className="text-[10px] text-text-dim">
                    {r.tecnico} · {r.progreso ?? "Ingresado"} · {fmtDate(r.fechaInicio)}
                  </div>
                </div>
                <PrioridadBadge prioridad={r.prioridad} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={openReading}
        onClose={() => setOpenReading(false)}
        title="Nueva lectura"
        description={`Motor ${m.nombre}`}
      >
        <ReadingForm
          assetId={id}
          onSubmit={(input) => createReading.mutateAsync(input)}
          onSuccess={() => setOpenReading(false)}
        />
      </Modal>

      <Modal
        open={openRepair}
        onClose={() => setOpenRepair(false)}
        title="Nueva reparación"
        description={`Motor ${m.nombre}`}
      >
        <RepairForm
          defaultAssetId={id}
          onSubmit={(input) => createRepair.mutateAsync(input)}
          onSuccess={() => setOpenRepair(false)}
          submitLabel="Crear reparación"
        />
      </Modal>
    </PageContainer>
  );
}

function Kpi({
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

function Spec({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-dim">{label}</dt>
      <dd className="text-right text-text">{value ? value : <span className="text-text-dim">—</span>}</dd>
    </div>
  );
}

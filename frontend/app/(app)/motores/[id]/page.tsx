"use client";

import Link from "next/link";
import { use } from "react";
import { Pencil, ChevronLeft } from "lucide-react";
import { useMotor } from "@/lib/queries/motors";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { StatusDot, toneFromEstado } from "@/components/motor/StatusDot";

export default function MotorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const motorQuery = useMotor(id);

  if (motorQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={24} className="text-volt" />
      </div>
    );
  }
  if (!motorQuery.data) {
    return <div className="text-[13px] text-danger">Motor no encontrado.</div>;
  }

  const m = motorQuery.data;
  const tone = toneFromEstado(m.estadoActual);

  return (
    <div className="space-y-6">
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
          <Link href={`/motores/${m._id}/editar`}>
            <Button variant="secondary" iconLeft={<Pencil size={14} />}>
              Editar
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Potencia nominal</div>
          <div className="mt-2 font-mono text-3xl text-text">
            {m.potenciaKW ?? "—"}
            <span className="ml-1 text-[12px] text-text-dim">kW</span>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Planta</div>
          <div className="mt-2 text-[15px] text-text">{m.cliente}</div>
          <div className="mt-0.5 text-[12px] text-text-dim">
            {[m.sector, m.ubicacion].filter(Boolean).join(" · ") || "Sin ubicación"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Rol en la flota</div>
          <div className="mt-2 text-[15px] text-text">
            {m.esBackup ? "Motor de respaldo" : "Motor principal"}
          </div>
          {m.esBackup && (
            <div className="mt-0.5 text-[12px] text-text-dim">
              Estado: {m.estadoBackup ?? "Disponible"}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-[13px] text-text-muted">
          La vista detallada con consumo en vivo, historial de lecturas y
          reparaciones se construye en W3.
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Plug, Trash2, ExternalLink } from "lucide-react";
import { useSensors, useCreateSensor, useDeleteSensor } from "@/lib/queries/sensors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/Modal";
import { StatusDot } from "@/components/motor/StatusDot";
import { SensorForm } from "./SensorForm";
import { SENSOR_PROVIDERS, type Sensor } from "@/lib/types";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "ahora";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function providerLabel(p: string) {
  return SENSOR_PROVIDERS.find((x) => x.value === p)?.label ?? p;
}

function statusTone(s: Sensor["status"]): "running" | "alert" | "standby" | "offline" | "neutral" {
  switch (s) {
    case "online":
      return "running";
    case "error":
      return "alert";
    case "offline":
      return "offline";
    default:
      return "neutral";
  }
}

export function SensorsCard({ assetId }: { assetId: string }) {
  const sensorsQuery = useSensors({ assetId });
  const createSensor = useCreateSensor();
  const deleteSensor = useDeleteSensor();
  const [open, setOpen] = useState(false);

  const sensors = sensorsQuery.data ?? [];

  const handleDelete = (id: string, externalId: string) => {
    if (!confirm(`¿Desconectar sensor "${externalId}"? Las lecturas históricas se preservan.`)) return;
    deleteSensor.mutate(id);
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-text">Sensores conectados</div>
          <div className="text-[11px] text-text-dim">
            {sensors.length === 0 ? "ningún sensor configurado" : `${sensors.length} sensor${sensors.length === 1 ? "" : "es"}`}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<Plus size={12} />}
          onClick={() => setOpen(true)}
        >
          Conectar sensor
        </Button>
      </div>

      {sensors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg/30 px-4 py-8 text-center">
          <Plug size={20} className="mx-auto mb-3 text-text-dim" />
          <div className="text-[13px] text-text">Sin sensores conectados</div>
          <div className="mt-1 text-[11px] text-text-muted">
            Cualquier sensor — Dynamox, Tractian, WEG, MQTT, genéricos — empuja datos al mismo endpoint.
          </div>
          <Link
            href="/integraciones"
            className="mt-3 inline-flex items-center gap-1 text-[12px] text-volt hover:text-text"
          >
            Ver guía de integración
            <ExternalLink size={11} />
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border bg-bg/40">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                <th className="px-3 py-2 font-normal">Proveedor</th>
                <th className="px-3 py-2 font-normal">External ID</th>
                <th className="px-3 py-2 font-normal">Tipo</th>
                <th className="px-3 py-2 font-normal">Estado</th>
                <th className="px-3 py-2 font-normal">Último visto</th>
                <th className="px-3 py-2 text-right font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sensors.map((s) => {
                const tone = statusTone(s.status);
                return (
                  <tr key={s._id} className="hover:bg-elev/40 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="rounded-md border border-border bg-bg/40 px-2 py-0.5 font-mono text-[10px] text-text-muted">
                        {providerLabel(s.provider)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-text">{s.externalId}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-text-muted">{s.type}</td>
                    <td className="px-3 py-2.5">
                      <StatusDot tone={tone} label={s.status} pulse={tone === "running"} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-text-muted">
                      {fmtDate(s.lastSeenAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(s._id, s.externalId)}
                        className="grid h-7 w-7 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-danger"
                        aria-label="Desconectar sensor"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Conectar sensor"
        description="Asocia un sensor físico o lógico a este motor."
      >
        <SensorForm
          defaultAssetId={assetId}
          onSubmit={(input) => createSensor.mutateAsync(input)}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </Card>
  );
}

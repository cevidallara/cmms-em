"use client";

import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
          <span className="mr-2 inline-block h-1 w-1 rounded-full bg-volt align-middle" />
          Dashboard
        </div>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-text">
          Hola, {usuario?.nombre} 👋
        </h2>
        <p className="mt-2 text-[15px] text-text-muted">
          Esta es tu vista de operación. La construimos en W2 — por ahora,
          el shell está listo y la sesión activa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Motores", value: "—", hint: "se cargará en W2" },
          { label: "Consumo hoy", value: "—", hint: "se cargará en W2" },
          { label: "Alertas activas", value: "—", hint: "se cargará en W2" },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-[10px] uppercase tracking-wider text-text-dim">{k.label}</div>
            <div className="mt-2 font-mono text-3xl text-text">{k.value}</div>
            <div className="mt-1 text-[12px] text-text-dim">{k.hint}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="text-[13px] text-text-muted">
          Próximas semanas: lista de motores, detalle por motor, kanban de
          reparaciones, comparador costo/beneficio, gestión de backups y red
          de centros de servicio.
        </div>
      </Card>
    </div>
  );
}

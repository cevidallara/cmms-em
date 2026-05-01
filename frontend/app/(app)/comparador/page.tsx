"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Download, Filter, LineChart } from "lucide-react";
import { useMotors } from "@/lib/queries/motors";
import { useReadings } from "@/lib/queries/readings";
import { analyzeMotor, summarize, type MotorAnalysis } from "@/lib/utils/comparador";
import { toCsv, downloadCsv } from "@/lib/utils/csv";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KpiSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Toggle } from "@/components/ui/Toggle";

type SortKey = "costoMensual" | "consumoMensual" | "eficiencia" | "ahorroProyectado" | "nombre";
type SortDir = "asc" | "desc";

const fmtMoney = (n: number, m: string) =>
  n > 0 ? `${m === "CLP" ? "$" : "USD "}${n.toLocaleString("es-CL", { maximumFractionDigits: 0 })}` : "—";

const fmtNumber = (n: number, decimals = 1) =>
  n > 0 ? n.toLocaleString("es-CL", { maximumFractionDigits: decimals }) : "—";

export default function ComparadorPage() {
  const motorsQuery = useMotors();
  const readingsQuery = useReadings();
  const [hideEmpty, setHideEmpty] = useState(true);
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("costoMensual");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const analyses = useMemo<MotorAnalysis[]>(() => {
    const motors = motorsQuery.data ?? [];
    const readings = readingsQuery.data ?? [];
    return motors
      .filter((m) => !m.esBackup)
      .map((m) => analyzeMotor(m, readings));
  }, [motorsQuery.data, readingsQuery.data]);

  const filtered = useMemo(() => {
    let list = analyses;
    if (hideEmpty) list = list.filter((a) => a.hasData);
    if (onlyCandidates) list = list.filter((a) => a.candidato);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((a) =>
        [a.motor.nombre, a.motor.cliente, a.motor.sector, a.motor.tipo, a.motor.marca]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      );
    }
    return [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "nombre") return a.motor.nombre.localeCompare(b.motor.nombre) * dir;
      const va = (a[sortKey] as number | null) ?? -Infinity;
      const vb = (b[sortKey] as number | null) ?? -Infinity;
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }, [analyses, hideEmpty, onlyCandidates, q, sortKey, sortDir]);

  const stats = useMemo(() => summarize(analyses), [analyses]);
  const maxCosto = useMemo(
    () => Math.max(1, ...analyses.filter((a) => a.hasData).map((a) => a.costoMensual)),
    [analyses]
  );

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "nombre" || key === "eficiencia" ? "asc" : "desc");
    }
  };

  const handleExport = () => {
    const headers = [
      "nombre", "tipo", "marca", "modelo", "planta", "sector",
      "potenciaKW", "consumoMensual_kWh", "costoMensual", "moneda",
      "eficiencia_%", "candidato", "ahorroProyectado", "fechaLectura",
    ];
    const rows = filtered.map((a) => [
      a.motor.nombre, a.motor.tipo, a.motor.marca, a.motor.modelo,
      a.motor.cliente, a.motor.sector, a.motor.potenciaKW,
      a.consumoMensual || "", a.costoMensual || "", a.moneda,
      a.eficiencia ?? "", a.candidato ? "sí" : "no",
      a.ahorroProyectado || "", a.fechaLectura ?? "",
    ]);
    const csv = toCsv(headers, rows);
    downloadCsv(`nikolator-comparador-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  if (motorsQuery.isLoading || readingsQuery.isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={6} cols={6} />
      </PageContainer>
    );
  }

  if (motorsQuery.isError || readingsQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          title="No pudimos cargar el comparador"
          message={((motorsQuery.error || readingsQuery.error) as Error)?.message}
          onRetry={() => {
            motorsQuery.refetch();
            readingsQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  if ((motorsQuery.data?.length ?? 0) === 0) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Análisis"
          title="Comparador costo / beneficio"
          description="Identifica candidatos a reemplazo y oportunidades de eficiencia."
        />
        <EmptyState
          icon={<LineChart size={20} />}
          title="Aún no hay motores para comparar"
          description="Carga motores y lecturas para empezar el análisis cruzado."
          action={
            <Link href="/motores/nuevo">
              <Button>Crear primer motor</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const monedaPrincipal = analyses.find((a) => a.hasData)?.moneda ?? "USD";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Análisis"
        title="Comparador costo / beneficio"
        description="Identifica candidatos a reemplazo y proyecta el ahorro al optimizar la flota."
        actions={
          <Button
            variant="secondary"
            iconLeft={<Download size={14} />}
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            Exportar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Motores analizados" value={stats.motoresAnalizados.toString()} hint={stats.motoresSinDatos > 0 ? `${stats.motoresSinDatos} sin lecturas` : "todos con datos"} />
        <Stat label="Costo total mensual" value={fmtMoney(stats.costoTotal, monedaPrincipal)} unit={monedaPrincipal} />
        <Stat label="Ahorro proyectado" value={fmtMoney(stats.ahorroTotal, monedaPrincipal)} unit={monedaPrincipal} positive={stats.ahorroTotal > 0} />
        <Stat label="Candidatos a reemplazo" value={stats.candidatos.toString()} hint="eficiencia < 80%" warning={stats.candidatos > 0} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar por nombre, planta o tipo…"
              className="block w-full rounded-lg border border-border bg-bg/40 py-2 pl-9 pr-3 text-[13px] text-text placeholder:text-text-dim outline-none focus:border-volt/50 focus:ring-2 focus:ring-volt/15"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <Toggle checked={hideEmpty} onChange={setHideEmpty} />
              <span className="text-[12px] text-text-muted">Ocultar sin datos</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <Toggle checked={onlyCandidates} onChange={setOnlyCandidates} />
              <span className="text-[12px] text-text-muted">Solo candidatos</span>
            </label>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Ajusta los filtros o carga lecturas a más motores."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border">
                <tr className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  <ColHeader label="Motor" k="nombre" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="px-5 py-3 font-normal">Planta</th>
                  <ColHeader label="Consumo" k="consumoMensual" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
                  <ColHeader label="Costo" k="costoMensual" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
                  <ColHeader label="Eff." k="eficiencia" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
                  <th className="px-5 py-3 font-normal">Costo relativo</th>
                  <ColHeader label="Ahorro proy." k="ahorroProyectado" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a, i) => (
                  <Row
                    key={a.motor._id}
                    a={a}
                    i={i}
                    maxCosto={maxCosto}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-[11px] text-text-dim">
            <span>{filtered.length} motor{filtered.length === 1 ? "" : "es"}</span>
            <span>
              Candidato = eficiencia &lt; 80% · Ahorro = costo × (1 − eff/92%)
            </span>
          </div>
        </Card>
      )}

      {stats.candidatos > 0 && (
        <Card elevated className="p-6 border-volt/20 bg-volt/5">
          <div className="text-[10px] uppercase tracking-wider text-volt">Insight</div>
          <div className="mt-2 text-[15px] text-text">
            Reemplazar los {stats.candidatos} motor{stats.candidatos === 1 ? "" : "es"} con eficiencia bajo 80% podría
            ahorrar <span className="font-mono font-semibold text-volt">{fmtMoney(stats.ahorroTotal, monedaPrincipal)}</span> al mes
            asumiendo motores reemplazo de clase IE3 (≈92% eficiencia).
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

function ColHeader({
  label, k, sortKey, sortDir, onSort, align = "left",
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; align?: "left" | "right";
}) {
  const active = k === sortKey;
  return (
    <th className={`px-5 py-3 font-normal ${align === "right" ? "text-right" : ""}`}>
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 transition-colors ${active ? "text-text" : "hover:text-text-muted"}`}
      >
        {label}
        {active && (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
      </button>
    </th>
  );
}

function Row({ a, i, maxCosto }: { a: MotorAnalysis; i: number; maxCosto: number }) {
  const m = a.motor;
  const barPct = a.hasData ? Math.max(2, Math.round((a.costoMensual / maxCosto) * 100)) : 0;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(i * 0.02, 0.6) }}
      className={`hover:bg-elev/40 transition-colors ${a.candidato ? "bg-warning/5" : ""}`}
    >
      <td className="px-5 py-3">
        <Link href={`/motores/${m._id}`} className="block">
          <div className="flex items-center gap-2">
            {a.candidato && (
              <span className="h-1.5 w-1.5 rounded-full bg-warning" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
            )}
            <span className="font-medium text-text">{m.nombre}</span>
          </div>
          <div className="font-mono text-[10px] text-text-dim">
            {m.tipo}{m.potenciaKW ? ` · ${m.potenciaKW} kW` : ""}
          </div>
        </Link>
      </td>
      <td className="px-5 py-3">
        <div className="text-text">{m.cliente || "—"}</div>
        <div className="text-[10px] text-text-dim">{m.sector || ""}</div>
      </td>
      <td className="px-5 py-3 text-right font-mono text-text">
        {a.hasData ? (
          <>
            {fmtNumber(a.consumoMensual, 0)}
            <span className="ml-0.5 text-[10px] text-text-dim">kWh</span>
          </>
        ) : <span className="text-text-dim">sin datos</span>}
      </td>
      <td className="px-5 py-3 text-right font-mono text-text">
        {a.hasData ? fmtMoney(a.costoMensual, a.moneda) : <span className="text-text-dim">—</span>}
      </td>
      <td className={`px-5 py-3 text-right font-mono ${a.candidato ? "text-warning" : "text-text-muted"}`}>
        {a.eficiencia != null ? `${a.eficiencia.toFixed(0)}%` : <span className="text-text-dim">—</span>}
      </td>
      <td className="px-5 py-3">
        {a.hasData ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 0.7, delay: Math.min(i * 0.03, 0.5), ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: a.candidato
                    ? "linear-gradient(90deg, #FF9F1C, #FF4D6D)"
                    : "linear-gradient(90deg, #B5F500, #00E5FF)",
                }}
              />
            </div>
            {a.candidato && (
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-warning">
                candidato
              </span>
            )}
          </div>
        ) : (
          <div className="h-1.5 rounded-full bg-bg/60" />
        )}
      </td>
      <td className="px-5 py-3 text-right font-mono text-text">
        {a.ahorroProyectado > 0 ? (
          <span className="text-volt">+ {fmtMoney(a.ahorroProyectado, a.moneda)}</span>
        ) : (
          <span className="text-text-dim">—</span>
        )}
      </td>
    </motion.tr>
  );
}

function Stat({
  label, value, unit, hint, positive, warning,
}: {
  label: string; value: string; unit?: string; hint?: string;
  positive?: boolean; warning?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-[10px] uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`font-mono text-2xl font-semibold ${
            positive ? "text-volt" : warning ? "text-warning" : "text-text"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-[12px] text-text-dim">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[12px] text-text-dim">{hint}</div>}
    </Card>
  );
}

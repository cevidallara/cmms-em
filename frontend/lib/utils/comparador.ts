import type { Asset, Reading } from "@/lib/types";

export type MotorAnalysis = {
  motor: Asset;
  hasData: boolean;
  consumoMensual: number;
  costoMensual: number;
  eficiencia: number | null;
  ahorroProyectado: number;
  candidato: boolean;
  moneda: "CLP" | "USD";
  fechaLectura?: string;
};

export type ComparadorOptions = {
  /** Eficiencia debajo de la cual se considera candidato (default: 80) */
  thresholdEficiencia?: number;
  /** Eficiencia objetivo al reemplazar (default: 92, ~IE3) */
  targetEficiencia?: number;
};

/**
 * Calcula métricas por motor usando la última lectura disponible.
 * Motors sin lecturas devuelven hasData=false.
 */
export function analyzeMotor(
  motor: Asset,
  readings: Reading[],
  options: ComparadorOptions = {}
): MotorAnalysis {
  const threshold = options.thresholdEficiencia ?? 80;
  const target = options.targetEficiencia ?? 92;

  const myReadings = readings
    .filter((r) => {
      const aid = typeof r.assetId === "string" ? r.assetId : r.assetId?._id;
      return aid === motor._id;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const latest = myReadings[0];
  if (!latest) {
    return {
      motor,
      hasData: false,
      consumoMensual: 0,
      costoMensual: 0,
      eficiencia: null,
      ahorroProyectado: 0,
      candidato: false,
      moneda: "USD",
    };
  }

  const consumoMensual = latest.consumoEnergia ?? 0;
  const costoMensual = latest.costoEnergia ?? 0;
  const eficiencia = latest.eficienciaEstimada ?? null;

  const candidato = eficiencia != null && eficiencia < threshold;
  const ahorroProyectado =
    candidato && eficiencia != null && costoMensual > 0
      ? costoMensual * Math.max(0, 1 - eficiencia / target)
      : 0;

  return {
    motor,
    hasData: true,
    consumoMensual,
    costoMensual,
    eficiencia,
    ahorroProyectado,
    candidato,
    moneda: latest.moneda ?? "USD",
    fechaLectura: latest.fecha,
  };
}

export function summarize(analyses: MotorAnalysis[]) {
  const withData = analyses.filter((a) => a.hasData);
  const candidatos = withData.filter((a) => a.candidato);
  const costoTotal = withData.reduce((s, a) => s + a.costoMensual, 0);
  const ahorroTotal = candidatos.reduce((s, a) => s + a.ahorroProyectado, 0);
  return {
    motoresAnalizados: withData.length,
    motoresSinDatos: analyses.length - withData.length,
    costoTotal,
    candidatos: candidatos.length,
    ahorroTotal,
  };
}

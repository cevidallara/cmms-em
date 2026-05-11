const Reading = require('../models/Reading');
const Anomaly = require('../models/Anomaly');
const Asset = require('../models/Asset');
const eventBus = require('./eventBus');

const METRICS = Anomaly.METRICS;
// Defaults pensados para producción con sensores ingestando >= 1 lectura/día.
// Para demos con pocos datos, override en .env (ej: ANOMALY_BASELINE_DAYS=180, ANOMALY_MIN_BASELINE_POINTS=3).
const BASELINE_DAYS = Number(process.env.ANOMALY_BASELINE_DAYS) || 30;
const MIN_BASELINE_POINTS = Number(process.env.ANOMALY_MIN_BASELINE_POINTS) || 8;
const Z_LOW = Number(process.env.ANOMALY_Z_LOW) || 3.0;
const Z_MEDIUM = Number(process.env.ANOMALY_Z_MEDIUM) || 4.0;
const Z_HIGH = Number(process.env.ANOMALY_Z_HIGH) || 5.0;
const COOLDOWN_HOURS = Number(process.env.ANOMALY_COOLDOWN_HOURS) || 6;
// 1.4826 hace que MAD sea consistente con stddev en distribuciones normales
const MAD_TO_STDDEV = 1.4826;

// ---------- funciones puras (testables) ----------

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * (s.length - 1))));
  return s[idx];
}

function computeBaseline(values) {
  const clean = values.filter(v => typeof v === 'number' && Number.isFinite(v));
  if (clean.length < MIN_BASELINE_POINTS) return null;
  const med = median(clean);
  const mad = median(clean.map(v => Math.abs(v - med))) || 0;
  return {
    count: clean.length,
    median: med,
    mad,
    p10: percentile(clean, 10),
    p90: percentile(clean, 90),
  };
}

function evaluateZ(value, baseline) {
  if (!baseline) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  // Si MAD es 0 (todos iguales), un valor distinto es anomalía pura → z = ±∞
  if (baseline.mad === 0) {
    if (value === baseline.median) return { z: 0, direction: 'high' };
    return { z: 99, direction: value > baseline.median ? 'high' : 'low' };
  }
  const stddevEq = baseline.mad * MAD_TO_STDDEV;
  const z = (value - baseline.median) / stddevEq;
  return { z: Math.abs(z), direction: z >= 0 ? 'high' : 'low' };
}

function classifySeverity(z) {
  if (z < Z_LOW) return null;
  if (z < Z_MEDIUM) return 'low';
  if (z < Z_HIGH) return 'medium';
  return 'high';
}

// ---------- DB-bound ----------

async function inCooldown(motorId, metric) {
  const since = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);
  const recent = await Anomaly.findOne({
    motorId,
    metric,
    detectedAt: { $gte: since },
    status: { $in: ['open', 'acked'] },
  });
  return !!recent;
}

/**
 * Evalúa una lectura nueva contra el baseline 30d previo del motor.
 * Por cada métrica, decide si es anomalía. Persiste y emite eventos.
 *
 * Retorna array de anomalies creadas.
 */
async function evaluateReading(reading) {
  if (!reading || !reading.assetId) return [];

  const motor = await Asset.findById(reading.assetId).select('_id nombre organizacionId');
  if (!motor) return [];

  const since = new Date(reading.fecha || Date.now());
  since.setDate(since.getDate() - BASELINE_DAYS);

  // Lecturas previas (excluyendo la que estamos evaluando)
  const prev = await Reading.find({
    assetId: motor._id,
    fecha: { $gte: since, $lt: reading.fecha || new Date() },
    _id: { $ne: reading._id },
  })
    .select(METRICS.join(' ') + ' fecha')
    .lean();

  const created = [];

  for (const metric of METRICS) {
    const value = reading[metric];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;

    const baseline = computeBaseline(prev.map(r => r[metric]));
    if (!baseline) continue;

    const result = evaluateZ(value, baseline);
    if (!result) continue;

    const severity = classifySeverity(result.z);
    if (!severity) continue;

    if (await inCooldown(motor._id, metric)) continue;

    const anomaly = await Anomaly.create({
      motorId: motor._id,
      organizacionId: motor.organizacionId,
      readingId: reading._id,
      metric,
      observedValue: value,
      baselineMedian: baseline.median,
      baselineMad: baseline.mad,
      baselineP10: baseline.p10,
      baselineP90: baseline.p90,
      baselineCount: baseline.count,
      zScore: Number(result.z.toFixed(2)),
      direction: result.direction,
      severity,
      status: 'open',
    });

    eventBus.publish(String(motor.organizacionId), {
      type: 'anomaly.created',
      payload: {
        anomalyId: anomaly._id.toString(),
        motorId: motor._id.toString(),
        motorNombre: motor.nombre,
        metric,
        severity,
        zScore: anomaly.zScore,
        direction: result.direction,
        observedValue: value,
        baselineMedian: baseline.median,
      },
    });

    created.push(anomaly);
  }

  return created;
}

/**
 * Backfill: escanea todas las lecturas recientes de un motor (o de toda la org)
 * y dispara evaluación. Usado por el endpoint /api/anomalies/scan.
 *
 * Solo evalúa la última lectura de cada motor — si ya hay anomaly en cooldown
 * para esa métrica, se saltea.
 */
async function scanOrgLatest(orgFilter) {
  const motors = await Asset.find(orgFilter).select('_id organizacionId').lean();
  let totalCreated = 0;
  for (const m of motors) {
    const latest = await Reading.findOne({ assetId: m._id }).sort({ fecha: -1 });
    if (!latest) continue;
    const created = await evaluateReading(latest);
    totalCreated += created.length;
  }
  return { motoresEvaluados: motors.length, anomaliasCreadas: totalCreated };
}

module.exports = {
  // pure
  median,
  computeBaseline,
  evaluateZ,
  classifySeverity,
  // DB
  evaluateReading,
  scanOrgLatest,
  // constants
  METRICS,
  BASELINE_DAYS,
};

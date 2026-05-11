const crypto = require('crypto');
const Asset = require('../models/Asset');
const Reading = require('../models/Reading');
const Repair = require('../models/Repair');
const MotorAdvice = require('../models/MotorAdvice');
const { getClient, recordUsage, HEAVY_MODEL } = require('./aiClient');

const SUBMIT_TOOL = {
  name: 'submit_analysis',
  description: 'Envía el análisis estructurado del motor. Llama esta tool exactamente una vez con el resultado del análisis costo/beneficio.',
  input_schema: {
    type: 'object',
    properties: {
      recommendation: {
        type: 'string',
        enum: ['mantener', 'reparar', 'reemplazar', 'swap_a_backup', 'datos_insuficientes'],
        description: 'Acción recomendada principal.',
      },
      recommendationLabel: {
        type: 'string',
        description: 'Frase corta de máximo 60 caracteres para mostrar al usuario en la UI (ej: "Reemplazar por motor IE3 de 75kW").',
      },
      reasoning: {
        type: 'string',
        description: 'Explicación de por qué se recomienda esto, citando los datos clave (eficiencia, costo, fallas). 2-4 oraciones.',
      },
      savingsEstimateUsd: {
        type: 'number',
        description: 'Ahorro estimado anual en USD si se aplica la recomendación. 0 si no aplica.',
      },
      paybackMonths: {
        type: 'number',
        description: 'Meses de payback estimado de la inversión (solo si recommendation = reemplazar). Omitir si no aplica.',
      },
      riskLevel: {
        type: 'string',
        enum: ['bajo', 'medio', 'alto'],
        description: 'Riesgo de no actuar (mantener el motor como está).',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confianza en la recomendación dado los datos disponibles. 0.3 si hay pocas lecturas, 0.8+ si hay historial sólido.',
      },
      supuestos: {
        type: 'array',
        items: { type: 'string' },
        description: 'Supuestos que se hicieron (ej: "horas de operación constantes", "tarifa eléctrica USD 0.12/kWh"). Sé explícito.',
      },
      proximosPasos: {
        type: 'array',
        items: { type: 'string' },
        description: '2-4 acciones concretas que el operador debería tomar.',
      },
    },
    required: ['recommendation', 'recommendationLabel', 'reasoning', 'savingsEstimateUsd', 'riskLevel', 'confidence', 'supuestos', 'proximosPasos'],
  },
};

function hashInputs(motor, lastReading) {
  const h = crypto.createHash('sha1');
  h.update(String(motor._id));
  h.update(motor.estadoActual || '');
  h.update(String(motor.potenciaKW || ''));
  h.update(motor.modelo || '');
  h.update(motor.marca || '');
  h.update(lastReading ? new Date(lastReading.fecha).toISOString() : 'no-reading');
  return h.digest('hex').slice(0, 16);
}

function summarizeReadings(readings) {
  if (!readings.length) return null;
  const consumos = readings.map(r => r.consumoEnergia).filter(n => typeof n === 'number');
  const eficiencias = readings.map(r => r.eficienciaEstimada).filter(n => typeof n === 'number');
  const costos = readings.map(r => r.costoEnergia).filter(n => typeof n === 'number');
  const factores = readings.map(r => r.factorCarga).filter(n => typeof n === 'number');
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  return {
    count: readings.length,
    desde: readings[readings.length - 1]?.fecha,
    hasta: readings[0]?.fecha,
    consumoAvg: avg(consumos),
    consumoMin: consumos.length ? Math.min(...consumos) : null,
    consumoMax: consumos.length ? Math.max(...consumos) : null,
    eficienciaAvg: avg(eficiencias),
    factorCargaAvg: avg(factores),
    costoTotal: costos.reduce((a, b) => a + b, 0),
    moneda: readings[0]?.moneda || 'USD',
  };
}

function buildUserPrompt(motor, readingsSummary, recientes, repairs) {
  const lines = [
    `Analiza el siguiente motor industrial y emite una recomendación costo/beneficio. Responde llamando exactamente UNA vez a submit_analysis.`,
    ``,
    `## Motor`,
    `Nombre: ${motor.nombre}`,
    `Tipo: ${motor.tipo || '—'}`,
    `Marca/Modelo: ${motor.marca || '—'} ${motor.modelo || ''}`,
    `Potencia: ${motor.potenciaKW || '—'} kW`,
    `Sector: ${motor.sector || '—'}`,
    `Cliente/Planta: ${motor.cliente || '—'}`,
    `Estado actual: ${motor.estadoActual || '—'}`,
    `Es backup: ${motor.esBackup ? 'sí' : 'no'}`,
    `Costo de adquisición original: ${motor.costo || '—'}`,
    ``,
  ];

  if (readingsSummary) {
    lines.push(
      `## Resumen de lecturas (últimos 90 días, ${readingsSummary.count} lecturas)`,
      `Desde ${new Date(readingsSummary.desde).toISOString().slice(0, 10)} hasta ${new Date(readingsSummary.hasta).toISOString().slice(0, 10)}`,
      `Consumo promedio: ${readingsSummary.consumoAvg?.toFixed(1) || '—'} kWh (min ${readingsSummary.consumoMin?.toFixed(1) || '—'}, max ${readingsSummary.consumoMax?.toFixed(1) || '—'})`,
      `Eficiencia promedio: ${readingsSummary.eficienciaAvg?.toFixed(1) || '—'}%`,
      `Factor de carga promedio: ${readingsSummary.factorCargaAvg?.toFixed(1) || '—'}%`,
      `Costo acumulado 90d: ${readingsSummary.costoTotal?.toFixed(0) || '—'} ${readingsSummary.moneda}`,
      ``,
    );
  } else {
    lines.push(`## Sin lecturas disponibles`, ``);
  }

  if (recientes.length) {
    lines.push(`## Últimas ${recientes.length} lecturas`);
    for (const r of recientes) {
      lines.push(
        `- ${new Date(r.fecha).toISOString().slice(0, 10)}: consumo ${r.consumoEnergia?.toFixed(1) || '—'} kWh, ` +
        `V ${r.voltaje || '—'}, A ${r.corriente?.toFixed(1) || '—'}, ` +
        `eff ${r.eficienciaEstimada?.toFixed(1) || '—'}%, fc ${r.factorCarga?.toFixed(0) || '—'}%`
      );
    }
    lines.push('');
  }

  if (repairs.length) {
    lines.push(`## Reparaciones recientes (${repairs.length})`);
    for (const rep of repairs.slice(0, 5)) {
      lines.push(
        `- ${new Date(rep.fechaInicio).toISOString().slice(0, 10)}: ` +
        `${rep.descripcion || rep.categoria || 'sin descripción'} ` +
        `[${rep.prioridad || '—'}, ${rep.progreso || rep.estado}]`
      );
    }
    lines.push('');
  }

  lines.push(
    `## Lineamiento de decisión`,
    `- mantener: motor con eficiencia >= 85%, sin patrones de falla, sin costo de reparación pendiente alto.`,
    `- reparar: hay falla específica trackeada en repairs o caída reciente de eficiencia que sugiere intervención puntual con payback < 12 meses.`,
    `- reemplazar: eficiencia < 80% sostenida + horas de operación altas que justifican CAPEX por motor IE3/IE4. Calcula payback con tarifa USD 0.12/kWh si no hay otro dato.`,
    `- swap_a_backup: hay backup disponible y este motor está en peor estado; conviene rotar.`,
    `- datos_insuficientes: <3 lecturas y sin historial de reparación. Confianza ≤ 0.4.`,
    ``,
    `Si los datos son escasos, baja la confidence y deja claro qué dato falta en supuestos.`,
  );

  return lines.join('\n');
}

async function getOrComputeAdvice(motorId, ctx, options = {}) {
  const motor = await Asset.findOne({ _id: motorId, ...ctx.tenantFilter });
  if (!motor) {
    const err = new Error('Motor no encontrado');
    err.status = 404;
    throw err;
  }

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [readings, repairs, lastReading] = await Promise.all([
    Reading.find({ assetId: motor._id, fecha: { $gte: since } })
      .sort({ fecha: -1 })
      .limit(90)
      .lean(),
    Repair.find({ assetId: motor._id })
      .sort({ fechaInicio: -1 })
      .limit(10)
      .lean(),
    Reading.findOne({ assetId: motor._id }).sort({ fecha: -1 }).lean(),
  ]);

  const contentVersion = hashInputs(motor, lastReading);

  if (!options.force) {
    const cached = await MotorAdvice.findOne({ motorId: motor._id });
    if (cached && cached.contentVersion === contentVersion) {
      return { advice: cached.toObject(), cached: true };
    }
  }

  const client = getClient();
  if (!client) {
    const err = new Error('IA no configurada');
    err.status = 503;
    throw err;
  }

  const userPrompt = buildUserPrompt(motor, summarizeReadings(readings), readings.slice(0, 10), repairs);

  const startedAt = Date.now();
  const message = await client.messages.create({
    model: HEAVY_MODEL,
    max_tokens: 1500,
    tools: [SUBMIT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_analysis' },
    messages: [{ role: 'user', content: userPrompt }],
  });
  const latencyMs = Date.now() - startedAt;

  await recordUsage({
    orgId: ctx.organizacionId,
    userId: ctx.userId,
    endpoint: 'advise/motor',
    model: HEAVY_MODEL,
    usage: message.usage,
    latencyMs,
  });

  const toolUse = (message.content || []).find(b => b.type === 'tool_use');
  if (!toolUse || !toolUse.input) {
    throw new Error('Modelo no devolvió análisis estructurado');
  }
  const data = toolUse.input;

  const saved = await MotorAdvice.findOneAndUpdate(
    { motorId: motor._id },
    {
      motorId: motor._id,
      organizacionId: motor.organizacionId,
      contentVersion,
      recommendation: data.recommendation,
      recommendationLabel: data.recommendationLabel,
      reasoning: data.reasoning,
      savingsEstimateUsd: data.savingsEstimateUsd || 0,
      paybackMonths: data.paybackMonths,
      riskLevel: data.riskLevel || 'medio',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
      supuestos: Array.isArray(data.supuestos) ? data.supuestos : [],
      proximosPasos: Array.isArray(data.proximosPasos) ? data.proximosPasos : [],
      modeloUsado: HEAVY_MODEL,
      computedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  return { advice: saved.toObject(), cached: false };
}

module.exports = { getOrComputeAdvice };

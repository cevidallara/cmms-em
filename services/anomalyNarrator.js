const Anomaly = require('../models/Anomaly');
const Asset = require('../models/Asset');
const Reading = require('../models/Reading');
const { getClient, recordUsage, DEFAULT_MODEL } = require('./aiClient');

const NARRATE_TOOL = {
  name: 'submit_narration',
  description: 'Devuelve la narración corta y la acción sugerida para esta anomalía detectada.',
  input_schema: {
    type: 'object',
    properties: {
      narration: {
        type: 'string',
        description: 'Explicación de 1-2 oraciones en español (tuteo chileno) sobre qué se observó. Cita el número y el cambio relativo respecto del baseline.',
      },
      suggestedAction: {
        type: 'string',
        description: 'Acción concreta recomendada al operador en una frase corta (≤80 caracteres).',
      },
    },
    required: ['narration', 'suggestedAction'],
  },
};

const METRIC_LABELS = {
  consumoEnergia: 'consumo energético (kWh)',
  voltaje: 'voltaje (V)',
  corriente: 'corriente (A)',
  factorCarga: 'factor de carga (%)',
  eficienciaEstimada: 'eficiencia (%)',
};

function buildPrompt(anomaly, motor, recientes) {
  const direction = anomaly.direction === 'high' ? 'subió' : 'bajó';
  const pctChange = anomaly.baselineMedian
    ? ((anomaly.observedValue - anomaly.baselineMedian) / anomaly.baselineMedian) * 100
    : null;

  const lines = [
    `Anomalía detectada en motor industrial. Llama exactamente UNA vez a submit_narration.`,
    ``,
    `Motor: ${motor.nombre} (${motor.tipo || '—'}, ${motor.potenciaKW || '—'} kW, ${motor.sector || '—'})`,
    ``,
    `Métrica: ${METRIC_LABELS[anomaly.metric] || anomaly.metric}`,
    `Valor observado: ${anomaly.observedValue.toFixed(2)} (${direction} respecto al baseline)`,
    `Baseline 30d: mediana ${anomaly.baselineMedian?.toFixed(2)}, p10 ${anomaly.baselineP10?.toFixed(2)}, p90 ${anomaly.baselineP90?.toFixed(2)}, n=${anomaly.baselineCount}`,
    `z-score: ${anomaly.zScore} (severidad ${anomaly.severity})`,
    pctChange != null ? `Cambio relativo: ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%` : '',
    ``,
  ];

  if (recientes.length) {
    lines.push(`Últimas ${recientes.length} lecturas (${anomaly.metric}):`);
    for (const r of recientes) {
      const v = r[anomaly.metric];
      if (typeof v === 'number') {
        lines.push(`  ${new Date(r.fecha).toISOString().slice(0, 10)}: ${v.toFixed(2)}`);
      }
    }
    lines.push('');
  }

  lines.push(
    `Reglas:`,
    `- Sé específico, cita el número observado y el % de cambio.`,
    `- Si la métrica subió mucho (corriente, consumo) sugiere causa mecánica/eléctrica plausible.`,
    `- Si bajó (eficiencia, factor de carga) sugiere chequeo o degradación.`,
    `- No inventes causas que requieran datos que no tienes.`,
    `- Acción: 1 frase, imperativo ("Verifica rodamientos…", "Revisa carga…"). ≤80 caracteres.`,
  );

  return lines.join('\n');
}

/**
 * Genera narración para una anomalía. No bloquea ingest — se llama fire-and-forget.
 * Updatea Anomaly con narration + suggestedAction.
 */
async function narrateAnomaly(anomalyId) {
  const client = getClient();
  if (!client) {
    await Anomaly.updateOne({ _id: anomalyId }, { narrationStatus: 'failed' });
    return;
  }

  const anomaly = await Anomaly.findById(anomalyId);
  if (!anomaly) return;

  try {
    const motor = await Asset.findById(anomaly.motorId);
    if (!motor) {
      await Anomaly.updateOne({ _id: anomalyId }, { narrationStatus: 'failed' });
      return;
    }

    const recientes = await Reading.find({ assetId: anomaly.motorId })
      .sort({ fecha: -1 })
      .limit(7)
      .select(`fecha ${anomaly.metric}`)
      .lean();

    const startedAt = Date.now();
    const message = await client.messages.create({
      model: DEFAULT_MODEL, // Haiku — narración es barata
      max_tokens: 400,
      tools: [NARRATE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_narration' },
      messages: [{ role: 'user', content: buildPrompt(anomaly, motor, recientes.reverse()) }],
    });
    const latencyMs = Date.now() - startedAt;

    await recordUsage({
      orgId: motor.organizacionId,
      endpoint: 'anomaly/narrate',
      model: DEFAULT_MODEL,
      usage: message.usage,
      latencyMs,
    });

    const toolUse = (message.content || []).find(b => b.type === 'tool_use');
    if (!toolUse?.input) {
      await Anomaly.updateOne({ _id: anomalyId }, { narrationStatus: 'failed' });
      return;
    }

    await Anomaly.updateOne(
      { _id: anomalyId },
      {
        narration: toolUse.input.narration,
        suggestedAction: toolUse.input.suggestedAction,
        narrationStatus: 'done',
      }
    );
  } catch (err) {
    console.error('narrateAnomaly error:', err.message);
    await Anomaly.updateOne({ _id: anomalyId }, { narrationStatus: 'failed' });
  }
}

module.exports = { narrateAnomaly };

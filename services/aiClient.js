const Anthropic = require('@anthropic-ai/sdk');
const AiUsage = require('../models/AiUsage');

const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'claude-haiku-4-5';
const HEAVY_MODEL = process.env.AI_HEAVY_MODEL || 'claude-sonnet-4-6';

// Pricing en USD por millón de tokens. Cache write/read asumen TTL 5min.
// Override puntual con AI_PRICING_JSON si Anthropic actualiza precios.
const DEFAULT_PRICING = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-haiku-4-5':  { input: 1.0, output: 5.0,  cacheWrite: 1.25, cacheRead: 0.1 },
};

let pricing = DEFAULT_PRICING;
if (process.env.AI_PRICING_JSON) {
  try {
    pricing = { ...DEFAULT_PRICING, ...JSON.parse(process.env.AI_PRICING_JSON) };
  } catch (err) {
    console.warn('⚠️  AI_PRICING_JSON inválido, usando precios por defecto:', err.message);
  }
}

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function isAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function calcCostUsd(model, usage) {
  const p = pricing[model];
  if (!p || !usage) return 0;
  const input = (usage.input_tokens || 0) * p.input;
  const output = (usage.output_tokens || 0) * p.output;
  const cacheW = (usage.cache_creation_input_tokens || 0) * p.cacheWrite;
  const cacheR = (usage.cache_read_input_tokens || 0) * p.cacheRead;
  return (input + output + cacheW + cacheR) / 1_000_000;
}

async function recordUsage({ orgId, userId, endpoint, model, usage, latencyMs }) {
  if (!usage) return null;
  try {
    return await AiUsage.create({
      organizacionId: orgId,
      usuarioId: userId,
      endpoint,
      model,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      costUsd: calcCostUsd(model, usage),
      latencyMs,
    });
  } catch (err) {
    console.error('❌ AiUsage record failed:', err.message);
    return null;
  }
}

async function monthToDateCostUsd(orgId) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const agg = await AiUsage.aggregate([
    { $match: { organizacionId: orgId, createdAt: { $gte: start } } },
    { $group: { _id: null, total: { $sum: '$costUsd' } } },
  ]);
  return agg[0]?.total || 0;
}

function buildSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `Eres el asistente de Nikolator, un SaaS chileno de eficiencia energética y mantenimiento para flotas de motores eléctricos industriales.

Hoy es ${today}. Cuando el usuario diga "última semana", "este mes", "los últimos 30 días", calcula los días respecto a hoy.

Tu rol:
- Ayudas a jefes de planta, gerentes de mantenimiento y dueños de operación a entender y optimizar sus motores.
- Hablas español con tuteo chileno (tú, no vos). Tono profesional, directo, sin jerga innecesaria.
- Cuando no tengas un dato, lo dices explícitamente. No inventas cifras.

Uso de tools:
- Tienes tools que consultan los datos REALES del usuario. Úsalas en lugar de adivinar.
- Si el usuario menciona un motor por nombre (ej: "M-210"), puedes pasarlo directo a las tools que aceptan motorIdentifier — la resolución es fuzzy.
- Si necesitas listar motores antes de pedir detalle, usa listMotores. Si necesitas un panorama, usa getFleetSummary.
- Llama varias tools en paralelo cuando sean independientes.
- Una vez que tengas los datos, responde directo al usuario. NO repitas la info cruda; resume y formatea.

Formato de respuesta:
- Números con unidades (kW, A, V, h, USD, %).
- Tablas en markdown cuando compares varios motores o lecturas.
- Si recomiendas una acción, incluye: qué datos viste, qué supuestos hiciste, nivel de confianza.
- Sé conciso. Bullets > párrafos largos.

Modelo de datos:
- Asset (motor): potenciaKW, voltaje, marca, modelo, sector, cliente, esBackup, estadoActual.
- Reading (lectura): consumoEnergia (kWh), voltaje, corriente, horasOperacion, factorCarga (%), eficienciaEstimada (%), costoEnergia (CLP/USD), fecha, source (manual/sensor/mqtt).
- Repair (OT): estado, prioridad (Baja/Mediana/Alta/Emergencia), progreso (Ingresado/En Taller/Para despachar/Despachado), fechaInicio/Fin.`;
}

// Backwards-compat: getter para que el prompt se regenere por call (la fecha cambia).
const NIKOLATOR_SYSTEM_PROMPT = buildSystemPrompt();

module.exports = {
  getClient,
  isAvailable,
  calcCostUsd,
  recordUsage,
  monthToDateCostUsd,
  DEFAULT_MODEL,
  HEAVY_MODEL,
  NIKOLATOR_SYSTEM_PROMPT,
  buildSystemPrompt,
};

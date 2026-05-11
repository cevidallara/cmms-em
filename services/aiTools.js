const Asset = require('../models/Asset');
const Reading = require('../models/Reading');
const Repair = require('../models/Repair');

/**
 * Definiciones de tools que el modelo puede llamar.
 * Formato Anthropic: name, description, input_schema (JSON Schema).
 *
 * Convenciones:
 * - Toda query respeta tenantFilter del usuario que hace la request.
 * - "motorIdentifier" acepta ObjectId, nombre o numeroSerie (resolución fuzzy).
 * - Fechas relativas: el sistema le pasa hoy en el system prompt; el modelo calcula días.
 */
const TOOL_DEFS = [
  {
    name: 'getFleetSummary',
    description: 'Resumen general de la flota del usuario: total de motores, distribución por sector/estado, cantidad de reparaciones abiertas, cantidad de motores backup. Usar cuando el usuario pregunte por el estado general o cantidades agregadas.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'listMotores',
    description: 'Lista los motores de la flota con specs principales (nombre, marca, modelo, potenciaKW, sector, estado, esBackup). Útil para encontrar IDs o cuando el usuario pide ver varios motores. Devuelve hasta 50 resultados.',
    input_schema: {
      type: 'object',
      properties: {
        sector: { type: 'string', description: 'Filtrar por sector (ej: "Producción", "Compresores").' },
        cliente: { type: 'string', description: 'Filtrar por cliente (multi-tenant interno).' },
        esBackup: { type: 'boolean', description: 'true para listar solo motores backup.' },
        estado: { type: 'string', description: 'Filtrar por estado/estadoActual.' },
        search: { type: 'string', description: 'Búsqueda libre en nombre, marca, modelo o numeroSerie.' },
      },
    },
  },
  {
    name: 'getMotorDetail',
    description: 'Devuelve el detalle completo de un motor por id, nombre o número de serie. Incluye cantidad de lecturas y reparaciones asociadas.',
    input_schema: {
      type: 'object',
      properties: {
        motorIdentifier: { type: 'string', description: 'ObjectId, nombre o numeroSerie del motor.' },
      },
      required: ['motorIdentifier'],
    },
  },
  {
    name: 'getReadings',
    description: 'Devuelve lecturas energéticas (consumo, voltaje, corriente, factor de carga, eficiencia) de un motor específico en los últimos N días, junto con un resumen estadístico (avg/min/max).',
    input_schema: {
      type: 'object',
      properties: {
        motorIdentifier: { type: 'string', description: 'ObjectId, nombre o numeroSerie del motor.' },
        days: { type: 'integer', description: 'Cantidad de días hacia atrás (default 30, máx 365).', minimum: 1, maximum: 365 },
        limit: { type: 'integer', description: 'Cantidad máxima de lecturas individuales a devolver (default 20).', minimum: 1, maximum: 200 },
      },
      required: ['motorIdentifier'],
    },
  },
  {
    name: 'getRepairs',
    description: 'Lista órdenes de trabajo (reparaciones). Filtros opcionales por motor, estado o prioridad. Útil para "qué reparaciones tengo abiertas", "qué OTs hay para tal motor".',
    input_schema: {
      type: 'object',
      properties: {
        motorIdentifier: { type: 'string', description: 'ObjectId, nombre o numeroSerie del motor (opcional).' },
        estado: { type: 'string', description: 'Filtrar por estado (pendiente, en_proceso, completada, etc).' },
        prioridad: { type: 'string', enum: ['Baja', 'Mediana', 'Alta', 'Emergencia'] },
        soloAbiertas: { type: 'boolean', description: 'true para excluir las completadas/despachadas.' },
      },
    },
  },
];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
}

async function resolveMotor(identifier, tenantFilter) {
  if (!identifier) return null;
  // Si parece ObjectId, prueba primero por id
  if (/^[a-f\d]{24}$/i.test(identifier)) {
    const byId = await Asset.findOne({ _id: identifier, ...tenantFilter });
    if (byId) return byId;
  }
  const re = new RegExp(`^${escapeRegex(identifier)}$`, 'i');
  const exact = await Asset.findOne({
    ...tenantFilter,
    $or: [{ nombre: re }, { numeroSerie: re }],
  });
  if (exact) return exact;
  // Fuzzy: contiene
  const reFuzzy = new RegExp(escapeRegex(identifier), 'i');
  return Asset.findOne({
    ...tenantFilter,
    $or: [{ nombre: reFuzzy }, { numeroSerie: reFuzzy }, { modelo: reFuzzy }],
  });
}

async function handleGetFleetSummary({ tenantFilter }) {
  const [total, bySector, byEstado, backups, openRepairs] = await Promise.all([
    Asset.countDocuments(tenantFilter),
    Asset.aggregate([
      { $match: tenantFilter },
      { $group: { _id: '$sector', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Asset.aggregate([
      { $match: tenantFilter },
      { $group: { _id: '$estadoActual', count: { $sum: 1 } } },
    ]),
    Asset.countDocuments({ ...tenantFilter, esBackup: true }),
    Repair.countDocuments({
      ...tenantFilter,
      progreso: { $in: ['Ingresado', 'En Taller', 'Para despachar'] },
    }),
  ]);
  return {
    totalMotores: total,
    motoresBackup: backups,
    porSector: bySector.map(s => ({ sector: s._id || '(sin sector)', count: s.count })),
    porEstado: byEstado.map(s => ({ estado: s._id || '(sin estado)', count: s.count })),
    reparacionesAbiertas: openRepairs,
  };
}

async function handleListMotores({ tenantFilter }, input) {
  const filter = { ...tenantFilter };
  if (input.sector) filter.sector = new RegExp(`^${escapeRegex(input.sector)}$`, 'i');
  if (input.cliente) filter.cliente = new RegExp(`^${escapeRegex(input.cliente)}$`, 'i');
  if (typeof input.esBackup === 'boolean') filter.esBackup = input.esBackup;
  if (input.estado) filter.estadoActual = new RegExp(`^${escapeRegex(input.estado)}$`, 'i');
  if (input.search) {
    const re = new RegExp(escapeRegex(input.search), 'i');
    filter.$or = [{ nombre: re }, { marca: re }, { modelo: re }, { numeroSerie: re }];
  }
  const motores = await Asset.find(filter)
    .select('nombre tipo marca modelo potenciaKW sector cliente estadoActual esBackup')
    .limit(50)
    .lean();
  return { count: motores.length, motores };
}

async function handleGetMotorDetail({ tenantFilter }, input) {
  const motor = await resolveMotor(input.motorIdentifier, tenantFilter);
  if (!motor) return { error: `Motor "${input.motorIdentifier}" no encontrado.` };
  const [readingsCount, repairsCount, lastReading] = await Promise.all([
    Reading.countDocuments({ assetId: motor._id }),
    Repair.countDocuments({ assetId: motor._id }),
    Reading.findOne({ assetId: motor._id }).sort({ fecha: -1 }).lean(),
  ]);
  return {
    motor: motor.toObject(),
    readingsCount,
    repairsCount,
    lastReading: lastReading
      ? {
          fecha: lastReading.fecha,
          consumoEnergia: lastReading.consumoEnergia,
          voltaje: lastReading.voltaje,
          corriente: lastReading.corriente,
          factorCarga: lastReading.factorCarga,
          eficienciaEstimada: lastReading.eficienciaEstimada,
          source: lastReading.source,
        }
      : null,
  };
}

async function handleGetReadings({ tenantFilter }, input) {
  const motor = await resolveMotor(input.motorIdentifier, tenantFilter);
  if (!motor) return { error: `Motor "${input.motorIdentifier}" no encontrado.` };

  const days = Math.min(Math.max(input.days || 30, 1), 365);
  const limit = Math.min(Math.max(input.limit || 20, 1), 200);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [readings, stats] = await Promise.all([
    Reading.find({ assetId: motor._id, fecha: { $gte: since } })
      .sort({ fecha: -1 })
      .limit(limit)
      .select('fecha consumoEnergia voltaje corriente horasOperacion factorCarga eficienciaEstimada costoEnergia source')
      .lean(),
    Reading.aggregate([
      { $match: { assetId: motor._id, fecha: { $gte: since } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          consumoAvg: { $avg: '$consumoEnergia' },
          consumoMin: { $min: '$consumoEnergia' },
          consumoMax: { $max: '$consumoEnergia' },
          voltajeAvg: { $avg: '$voltaje' },
          corrienteAvg: { $avg: '$corriente' },
          factorCargaAvg: { $avg: '$factorCarga' },
          eficienciaAvg: { $avg: '$eficienciaEstimada' },
          costoTotal: { $sum: '$costoEnergia' },
        },
      },
    ]),
  ]);

  return {
    motor: { _id: motor._id, nombre: motor.nombre, potenciaKW: motor.potenciaKW },
    rangoDias: days,
    desde: since,
    summary: stats[0] || { count: 0 },
    readings,
  };
}

async function handleGetRepairs({ tenantFilter }, input) {
  const filter = { ...tenantFilter };
  if (input.motorIdentifier) {
    const motor = await resolveMotor(input.motorIdentifier, tenantFilter);
    if (!motor) return { error: `Motor "${input.motorIdentifier}" no encontrado.` };
    filter.assetId = motor._id;
  }
  if (input.estado) filter.estado = input.estado;
  if (input.prioridad) filter.prioridad = input.prioridad;
  if (input.soloAbiertas) {
    filter.progreso = { $in: ['Ingresado', 'En Taller', 'Para despachar'] };
  }
  const repairs = await Repair.find(filter)
    .sort({ fechaInicio: -1 })
    .limit(50)
    .populate('assetId', 'nombre marca modelo')
    .lean();
  return { count: repairs.length, repairs };
}

const HANDLERS = {
  getFleetSummary: handleGetFleetSummary,
  listMotores: handleListMotores,
  getMotorDetail: handleGetMotorDetail,
  getReadings: handleGetReadings,
  getRepairs: handleGetRepairs,
};

async function runTool(name, input, ctx) {
  const handler = HANDLERS[name];
  if (!handler) return { error: `Tool desconocida: ${name}` };
  try {
    return await handler(ctx, input || {});
  } catch (err) {
    console.error(`runTool(${name}) error:`, err);
    return { error: err.message || String(err) };
  }
}

module.exports = { TOOL_DEFS, runTool };

const Sensor = require('../models/Sensor');
const Reading = require('../models/Reading');
const eventBus = require('./eventBus');
const anomalyDetector = require('./anomalyDetector');
const { narrateAnomaly } = require('./anomalyNarrator');

const READING_FIELDS = [
  'consumoEnergia',
  'voltaje',
  'corriente',
  'horasOperacion',
  'costoEnergia',
  'moneda',
  'factorCarga',
  'factorPotencia',
  'eficienciaEstimada',
  'consumoAnualKWh',
  'costoAnual',
  'claseIEActual',
  'observaciones',
  'odometro',
];

function pickReadingFields(payload) {
  const out = {};
  for (const f of READING_FIELDS) {
    if (payload[f] !== undefined && payload[f] !== null) out[f] = payload[f];
  }
  return out;
}

/**
 * Ingesta una sola lectura.
 * Resuelve el sensor por (sensorId) o (externalId+provider+org).
 * Crea Reading, actualiza metadata del Sensor, emite evento SSE.
 */
async function ingestOne(payload, organizacionId, source = 'sensor') {
  const { externalId, provider, sensorId, fecha } = payload;

  let sensor = null;
  if (sensorId) {
    sensor = await Sensor.findOne({ _id: sensorId, organizacionId });
  } else if (externalId && provider) {
    sensor = await Sensor.findOne({ externalId, provider, organizacionId });
  } else {
    return {
      ok: false,
      error: 'Se requiere sensorId o (externalId + provider)',
    };
  }

  if (!sensor) {
    return {
      ok: false,
      error: 'Sensor no encontrado. Registra el sensor primero en /integraciones.',
    };
  }

  const readingData = pickReadingFields(payload);
  const fechaObj = fecha ? new Date(fecha) : new Date();

  const reading = await Reading.create({
    ...readingData,
    assetId: sensor.assetId,
    organizacionId,
    sensorId: sensor._id,
    source,
    fecha: fechaObj,
  });

  // Actualizar metadata del sensor (no bloquea)
  Sensor.updateOne(
    { _id: sensor._id },
    {
      lastSeenAt: new Date(),
      lastValue: readingData,
      status: 'online',
    }
  ).catch((err) => console.error('Failed to update sensor metadata:', err.message));

  // Emitir evento SSE para suscriptores de la org
  eventBus.publish(String(organizacionId), {
    type: 'reading.created',
    payload: {
      readingId: reading._id.toString(),
      sensorId: sensor._id.toString(),
      assetId: sensor.assetId.toString(),
      source,
      fecha: reading.fecha,
      ...readingData,
    },
  });

  // Detección de anomalías fire-and-forget — no bloquea el ack al sensor
  anomalyDetector
    .evaluateReading(reading)
    .then((anomalies) => {
      // Disparar narración LLM async para cada anomalía nueva
      for (const a of anomalies) {
        narrateAnomaly(a._id).catch((err) =>
          console.error('narrateAnomaly bg error:', err.message)
        );
      }
    })
    .catch((err) => console.error('anomaly evaluateReading error:', err.message));

  return { ok: true, readingId: reading._id, sensorId: sensor._id };
}

module.exports = { ingestOne };

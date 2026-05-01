const Sensor = require('../models/Sensor');
const Reading = require('../models/Reading');

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
      payload,
    };
  }

  if (!sensor) {
    return {
      ok: false,
      error: 'Sensor no encontrado. Registra el sensor primero en /integraciones.',
      payload,
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

  // Actualizar metadata del sensor (no bloquea la respuesta principal)
  Sensor.updateOne(
    { _id: sensor._id },
    {
      lastSeenAt: new Date(),
      lastValue: readingData,
      status: 'online',
    }
  ).catch((err) => console.error('Failed to update sensor metadata:', err.message));

  return { ok: true, readingId: reading._id, sensorId: sensor._id };
}

exports.ingest = async (req, res) => {
  try {
    const organizacionId = req.organizacionId;
    if (!organizacionId) {
      return res.status(401).json({ error: 'API key no asociada a una organización' });
    }

    const payloads = Array.isArray(req.body) ? req.body : [req.body];
    if (payloads.length === 0) {
      return res.status(400).json({ error: 'Body vacío' });
    }
    if (payloads.length > 100) {
      return res.status(413).json({ error: 'Máximo 100 lecturas por request' });
    }

    const results = await Promise.all(
      payloads.map((p) => ingestOne(p, organizacionId, 'sensor').catch((err) => ({ ok: false, error: err.message })))
    );

    const ingested = results.filter((r) => r.ok).length;
    const errors = results
      .map((r, i) => (r.ok ? null : { index: i, error: r.error }))
      .filter(Boolean);

    const status = ingested === payloads.length ? 200 : ingested > 0 ? 207 : 400;
    res.status(status).json({
      ingested,
      total: payloads.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: error.message });
  }
};

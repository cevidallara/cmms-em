const Reading = require('../models/Reading');
const Asset = require('../models/Asset');
const anomalyDetector = require('../services/anomalyDetector');
const { narrateAnomaly } = require('../services/anomalyNarrator');

exports.getAll = async (req, res) => {
  try {
    const readings = await Reading.find(req.tenantFilter).populate('assetId');
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const reading = await Reading.findOne({ _id: req.params.id, ...req.tenantFilter }).populate('assetId');
    if (!reading) return res.status(404).json({ error: 'Lectura no encontrada' });
    res.json(reading);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.assetId) {
      return res.status(400).json({ error: 'assetId es requerido' });
    }
    // La lectura hereda la org del motor, no del usuario (superadmin no tiene org).
    // tenantFilter ya valida que el usuario tenga acceso al motor.
    const asset = await Asset.findOne({ _id: req.body.assetId, ...req.tenantFilter });
    if (!asset) {
      return res.status(404).json({ error: 'Motor no encontrado' });
    }

    const data = {
      ...req.body,
      organizacionId: asset.organizacionId,
      creadoPor: req.usuario._id,
      source: req.body.source || 'manual',
    };
    const reading = await Reading.create(data);

    // Anomaly detection async — no bloquea response
    anomalyDetector
      .evaluateReading(reading)
      .then((anomalies) => {
        for (const a of anomalies) {
          narrateAnomaly(a._id).catch((err) =>
            console.error('narrateAnomaly bg error:', err.message)
          );
        }
      })
      .catch((err) => console.error('anomaly evaluateReading error:', err.message));

    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const reading = await Reading.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { returnDocument: "after" }
    );
    if (!reading) return res.status(404).json({ error: 'Lectura no encontrada' });
    res.json(reading);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const reading = await Reading.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!reading) return res.status(404).json({ error: 'Lectura no encontrada' });
    res.json({ message: 'Lectura eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

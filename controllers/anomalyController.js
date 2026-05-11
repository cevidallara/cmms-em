const Anomaly = require('../models/Anomaly');
const anomalyDetector = require('../services/anomalyDetector');
const { narrateAnomaly } = require('../services/anomalyNarrator');

exports.list = async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.status) {
      filter.status = req.query.status;
    } else if (req.query.includeAll !== 'true') {
      filter.status = { $in: ['open', 'acked'] };
    }
    if (req.query.motorId) filter.motorId = req.query.motorId;
    if (req.query.severity) filter.severity = req.query.severity;

    const anomalies = await Anomaly.find(filter)
      .sort({ detectedAt: -1 })
      .limit(200)
      .populate('motorId', 'nombre tipo marca modelo potenciaKW')
      .lean();
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.counts = async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    const agg = await Anomaly.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { status: '$status', severity: '$severity' },
          count: { $sum: 1 },
        },
      },
    ]);
    const result = { open: 0, acked: 0, resolved: 0, false_positive: 0, bySeverity: { low: 0, medium: 0, high: 0 } };
    for (const r of agg) {
      result[r._id.status] = (result[r._id.status] || 0) + r.count;
      if (r._id.status === 'open' || r._id.status === 'acked') {
        result.bySeverity[r._id.severity] = (result.bySeverity[r._id.severity] || 0) + r.count;
      }
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function transitionStatus(req, res, status, extraFields = {}) {
  try {
    const anomaly = await Anomaly.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { status, ackedBy: req.usuario._id, ...extraFields },
      { returnDocument: "after" }
    );
    if (!anomaly) return res.status(404).json({ error: 'Anomalía no encontrada' });
    res.json(anomaly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.ack = (req, res) => transitionStatus(req, res, 'acked', { ackedAt: new Date() });
exports.resolve = (req, res) => transitionStatus(req, res, 'resolved', { resolvedAt: new Date() });
exports.falsePositive = (req, res) => transitionStatus(req, res, 'false_positive', { resolvedAt: new Date() });

exports.regenerateNarration = async (req, res) => {
  try {
    const anomaly = await Anomaly.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!anomaly) return res.status(404).json({ error: 'Anomalía no encontrada' });
    await Anomaly.updateOne({ _id: anomaly._id }, { narrationStatus: 'pending' });
    narrateAnomaly(anomaly._id).catch((err) => console.error(err));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.scan = async (req, res) => {
  try {
    const result = await anomalyDetector.scanOrgLatest(req.tenantFilter);
    // Disparar narración para todas las anomalies que estén pending
    const pending = await Anomaly.find({
      ...req.tenantFilter,
      narrationStatus: 'pending',
    })
      .select('_id')
      .limit(50)
      .lean();
    for (const a of pending) {
      narrateAnomaly(a._id).catch((err) => console.error(err));
    }
    res.json(result);
  } catch (err) {
    console.error('anomaly scan error:', err);
    res.status(500).json({ error: err.message });
  }
};

const mongoose = require('mongoose');

const ANOMALY_METRICS = [
  'consumoEnergia',
  'voltaje',
  'corriente',
  'factorCarga',
  'eficienciaEstimada',
];

const anomalySchema = new mongoose.Schema({
  motorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true, index: true },
  readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reading' },

  metric: { type: String, enum: ANOMALY_METRICS, required: true },
  observedValue: { type: Number, required: true },
  baselineMedian: { type: Number },
  baselineMad: { type: Number },
  baselineP10: { type: Number },
  baselineP90: { type: Number },
  baselineCount: { type: Number },
  zScore: { type: Number, required: true },
  direction: { type: String, enum: ['high', 'low'], required: true },

  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: {
    type: String,
    enum: ['open', 'acked', 'resolved', 'false_positive'],
    default: 'open',
    index: true,
  },

  narration: { type: String },
  suggestedAction: { type: String },
  narrationStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },

  detectedAt: { type: Date, default: Date.now, index: true },
  ackedAt: { type: Date },
  resolvedAt: { type: Date },
  ackedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
});

anomalySchema.index({ organizacionId: 1, status: 1, detectedAt: -1 });
anomalySchema.index({ motorId: 1, metric: 1, detectedAt: -1 });

const Anomaly = mongoose.model('Anomaly', anomalySchema);
Anomaly.METRICS = ANOMALY_METRICS;
module.exports = Anomaly;

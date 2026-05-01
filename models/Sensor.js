const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  organizacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizacion',
    required: true,
    index: true,
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
    index: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['webhook', 'dynamox', 'tractian', 'weg', 'mqtt-generic', 'manual', 'otro'],
    default: 'webhook',
  },
  externalId: { type: String, required: true },
  type: {
    type: String,
    enum: ['energy', 'vibration', 'temperature', 'rotation', 'general'],
    default: 'general',
  },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastSeenAt: { type: Date },
  lastValue: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['online', 'offline', 'error', 'unknown'],
    default: 'unknown',
  },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  createdAt: { type: Date, default: Date.now },
});

sensorSchema.index({ organizacionId: 1, provider: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Sensor', sensorSchema);

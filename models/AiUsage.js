const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', index: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  endpoint: { type: String, required: true },
  model: { type: String, required: true, index: true },
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  cacheCreationTokens: { type: Number, default: 0 },
  cacheReadTokens: { type: Number, default: 0 },
  costUsd: { type: Number, default: 0 },
  latencyMs: { type: Number },
  createdAt: { type: Date, default: Date.now, index: true },
});

aiUsageSchema.index({ organizacionId: 1, createdAt: -1 });

module.exports = mongoose.model('AiUsage', aiUsageSchema);

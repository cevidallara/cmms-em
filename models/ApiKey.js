const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  organizacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizacion',
    required: true,
    index: true,
  },
  nombre: { type: String, required: true },
  prefix: { type: String, required: true }, // ej. "nik_live_AbCd"
  hashSha256: { type: String, required: true, index: true, unique: true },
  scopes: {
    type: [String],
    default: ['ingest:write', 'read'],
  },
  lastUsedAt: { type: Date },
  revokedAt: { type: Date, default: null },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ApiKey', apiKeySchema);

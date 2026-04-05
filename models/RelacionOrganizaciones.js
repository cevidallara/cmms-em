const mongoose = require('mongoose');

const relacionSchema = new mongoose.Schema({
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true },
  centroId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true },
  estado: { type: String, enum: ['activa', 'suspendida'], default: 'activa' },
  creadoEn: { type: Date, default: Date.now },
});

relacionSchema.index({ empresaId: 1, centroId: 1 }, { unique: true });

module.exports = mongoose.model('RelacionOrganizaciones', relacionSchema);

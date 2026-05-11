const mongoose = require('mongoose');

const organizacionSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  tipo: { type: String, enum: ['empresa', 'centro'], required: true },
  rut: { type: String, trim: true },
  direccion: { type: String },
  telefono: { type: String },
  activa: { type: Boolean, default: true },
  aiBudgetUsd: { type: Number },
  creadoEn: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Organizacion', organizacionSchema);

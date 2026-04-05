const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  tecnico: { type: String, required: true },
  estado: { type: String, default: 'pendiente' },
  descripcion: { type: String },
  fechaInicio: { type: Date, default: Date.now },
  fechaFin: { type: Date },
  otCliente: { type: String },
  nrcv: { type: String },
  prioridad: { type: String, enum: ['Baja', 'Mediana', 'Alta', 'Emergencia'], default: 'Mediana' },
  categoria: { type: String },
  subcategoria: { type: String },
  responsable: { type: String },
  mandante: { type: String },
  sector: { type: String },
  progreso: { type: String, enum: ['Ingresado', 'En Taller', 'Para despachar', 'Despachado'], default: 'Ingresado' },
  guiaCliente: { type: String },
  fechaDespacho: { type: Date },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true, index: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  centroServicioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion' },
  asignadoA: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
});

module.exports = mongoose.model('Repair', repairSchema);

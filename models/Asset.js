const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, required: true },
  modelo: { type: String },
  ubicacion: { type: String },
  estado: { type: String, default: 'activo' },
  cliente: { type: String, required: true },
  sector: { type: String },
  categoria: { type: String },
  subcategoria: { type: String },
  potenciaKW: { type: Number },
  numeroSerie: { type: String },
  marca: { type: String },
  estadoActual: { type: String, default: 'Operativo' },
  esBackup: { type: Boolean, default: false },
  estadoBackup: { type: String, enum: ['Disponible', 'Reservado', 'En Uso'] },
  activoRelacionado: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  proveedor: { type: String },
  fechaAdquisicion: { type: Date },
  costo: { type: Number },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true, index: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);

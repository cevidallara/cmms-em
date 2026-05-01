const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  odometro: { type: Number },
  consumoEnergia: { type: Number },
  fecha: { type: Date, default: Date.now },
  voltaje: { type: Number },
  corriente: { type: Number },
  horasOperacion: { type: Number },
  costoEnergia: { type: Number },
  moneda: { type: String, enum: ['CLP', 'USD'], default: 'CLP' },
  factorCarga: { type: Number, default: 75 },
  factorPotencia: { type: Number, default: 0.85 },
  eficienciaEstimada: { type: Number },
  consumoAnualKWh: { type: Number },
  costoAnual: { type: Number },
  claseIEActual: { type: String, enum: ['IE1', 'IE2', 'IE3', 'IE4'] },
  observaciones: { type: String },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true, index: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor', index: true },
  source: {
    type: String,
    enum: ['manual', 'sensor', 'scada', 'import', 'mqtt'],
    default: 'manual',
    index: true,
  },
});

module.exports = mongoose.model('Reading', readingSchema);

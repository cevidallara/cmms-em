const mongoose = require('mongoose');

/**
 * Cache de recomendaciones IA por motor.
 *
 * `contentVersion` es un hash determinístico de los inputs que afectan la advice
 * (motor.updatedAt-equivalent y la última lectura). Si el motor o sus lecturas
 * no cambiaron, reutilizamos la advice cacheada en lugar de pagar otra call.
 */
const motorAdviceSchema = new mongoose.Schema({
  motorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, unique: true, index: true },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true, index: true },
  contentVersion: { type: String, required: true },

  recommendation: {
    type: String,
    enum: ['mantener', 'reparar', 'reemplazar', 'swap_a_backup', 'datos_insuficientes'],
    required: true,
  },
  recommendationLabel: { type: String },
  reasoning: { type: String, required: true },
  savingsEstimateUsd: { type: Number, default: 0 },
  paybackMonths: { type: Number },
  riskLevel: { type: String, enum: ['bajo', 'medio', 'alto'], default: 'medio' },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  supuestos: [{ type: String }],
  proximosPasos: [{ type: String }],

  modeloUsado: { type: String },
  computedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MotorAdvice', motorAdviceSchema);

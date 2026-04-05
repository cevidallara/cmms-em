const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const roles = ['empresa_admin', 'empresa_tecnico', 'centro_admin', 'centro_tecnico', 'superadmin'];

const usuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, trim: true },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', default: null },
  rol: { type: String, enum: roles, required: true },
  activo: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  ultimoAcceso: { type: Date },
}, { timestamps: true });

usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

usuarioSchema.methods.compararPassword = async function (candidato) {
  return bcrypt.compare(candidato, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);

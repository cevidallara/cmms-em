const mongoose = require('mongoose');

const rolesInvitables = ['empresa_admin', 'empresa_tecnico', 'centro_admin', 'centro_tecnico'];

const invitacionSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  organizacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizacion', required: true },
  rol: { type: String, enum: rolesInvitables, required: true },
  token: { type: String, required: true, unique: true },
  expiraEn: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  invitadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  usada: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Invitacion', invitacionSchema);

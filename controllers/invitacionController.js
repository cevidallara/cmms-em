const crypto = require('crypto');
const Invitacion = require('../models/Invitacion');
const Usuario = require('../models/Usuario');
const Organizacion = require('../models/Organizacion');

const EXPIRACION_HORAS = 48;

// POST /api/invitaciones — Admin crea invitación
exports.crear = async (req, res) => {
  try {
    const { email, rol } = req.body;
    if (!email || !rol) {
      return res.status(400).json({ error: 'Email y rol son requeridos' });
    }

    // Validar que el rol es coherente con el tipo de org
    const org = await Organizacion.findById(req.usuario.organizacionId);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });

    const rolesValidos = org.tipo === 'empresa'
      ? ['empresa_admin', 'empresa_tecnico']
      : ['centro_admin', 'centro_tecnico'];

    if (!rolesValidos.includes(rol) && req.usuario.rol !== 'superadmin') {
      return res.status(400).json({ error: `Rol inválido para organización tipo ${org.tipo}` });
    }

    // Verificar que no exista usuario con ese email
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    // Verificar que no haya invitación pendiente
    const invitacionPendiente = await Invitacion.findOne({
      email: email.toLowerCase(),
      organizacionId: req.usuario.organizacionId,
      usada: false,
      expiraEn: { $gt: new Date() },
    });
    if (invitacionPendiente) {
      return res.status(409).json({ error: 'Ya existe una invitación pendiente para este email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date(Date.now() + EXPIRACION_HORAS * 60 * 60 * 1000);

    const invitacion = await Invitacion.create({
      email: email.toLowerCase(),
      organizacionId: req.usuario.organizacionId,
      rol,
      token,
      expiraEn,
      invitadoPor: req.usuario._id,
    });

    res.status(201).json({
      _id: invitacion._id,
      email: invitacion.email,
      rol: invitacion.rol,
      token: invitacion.token,
      expiraEn: invitacion.expiraEn,
    });
  } catch (error) {
    console.error('Error al crear invitación:', error);
    res.status(500).json({ error: 'Error al crear invitación' });
  }
};

// GET /api/invitaciones — Listar pendientes de mi org
exports.listar = async (req, res) => {
  try {
    const filter = {
      organizacionId: req.usuario.organizacionId,
      usada: false,
      expiraEn: { $gt: new Date() },
    };
    if (req.usuario.rol === 'superadmin') delete filter.organizacionId;

    const invitaciones = await Invitacion.find(filter)
      .populate('invitadoPor', 'nombre email')
      .populate('organizacionId', 'nombre tipo');

    res.json(invitaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar invitaciones' });
  }
};

// POST /api/invitaciones/aceptar — Público, crea usuario con token de invitación
exports.aceptar = async (req, res) => {
  try {
    const { token, password, nombre, apellido } = req.body;
    if (!token || !password || !nombre) {
      return res.status(400).json({ error: 'Token, password y nombre son requeridos' });
    }

    const invitacion = await Invitacion.findOne({
      token,
      usada: false,
      expiraEn: { $gt: new Date() },
    });

    if (!invitacion) {
      return res.status(404).json({ error: 'Invitación inválida o expirada' });
    }

    // Verificar que no se haya registrado entre tanto
    const existente = await Usuario.findOne({ email: invitacion.email });
    if (existente) {
      invitacion.usada = true;
      await invitacion.save();
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const usuario = await Usuario.create({
      email: invitacion.email,
      password,
      nombre,
      apellido,
      organizacionId: invitacion.organizacionId,
      rol: invitacion.rol,
    });

    invitacion.usada = true;
    await invitacion.save();

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      usuario: { _id: usuario._id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    });
  } catch (error) {
    console.error('Error al aceptar invitación:', error);
    res.status(500).json({ error: 'Error al aceptar invitación' });
  }
};

// DELETE /api/invitaciones/:id — Cancelar invitación
exports.cancelar = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.usuario.rol !== 'superadmin') {
      filter.organizacionId = req.usuario.organizacionId;
    }

    const invitacion = await Invitacion.findOneAndDelete(filter);
    if (!invitacion) return res.status(404).json({ error: 'Invitación no encontrada' });

    res.json({ message: 'Invitación cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar invitación' });
  }
};

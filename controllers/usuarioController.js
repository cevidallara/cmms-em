const Usuario = require('../models/Usuario');

// GET /api/usuarios — Listar usuarios de mi organización
exports.getAll = async (req, res) => {
  try {
    const filter = { organizacionId: req.usuario.organizacionId };
    if (req.usuario.rol === 'superadmin') delete filter.organizacionId;

    const usuarios = await Usuario.find(filter).select('-refreshToken');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// GET /api/usuarios/:id — Detalle de usuario (admin de mi org o self)
exports.getById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-refreshToken').populate('organizacionId');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const esAdmin = req.usuario.rol === 'superadmin' ||
      req.usuario.rol.endsWith('_admin');
    const esSelf = req.usuario._id.toString() === req.params.id;
    const mismaOrg = req.usuario.organizacionId?.toString() === usuario.organizacionId?._id?.toString();

    if (!esSelf && !(esAdmin && mismaOrg) && req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'No tiene permisos' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// PUT /api/usuarios/:id — Editar usuario (admin de mi org o self para campos limitados)
exports.update = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const esSelf = req.usuario._id.toString() === req.params.id;
    const esAdmin = req.usuario.rol === 'superadmin' ||
      req.usuario.rol.endsWith('_admin');
    const mismaOrg = req.usuario.organizacionId?.toString() === usuario.organizacionId?.toString();

    if (!esSelf && !(esAdmin && mismaOrg) && req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'No tiene permisos' });
    }

    // Self solo puede editar nombre, apellido, password
    const camposPermitidos = esSelf && !esAdmin
      ? ['nombre', 'apellido', 'password']
      : ['nombre', 'apellido', 'rol', 'activo'];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) usuario[campo] = req.body[campo];
    });

    await usuario.save();
    const { password, refreshToken, ...data } = usuario.toObject();
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
};

// DELETE /api/usuarios/:id — Desactivar usuario (admin)
exports.deactivate = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const mismaOrg = req.usuario.organizacionId?.toString() === usuario.organizacionId?.toString();
    if (!mismaOrg && req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'No tiene permisos' });
    }

    // No puede desactivarse a sí mismo
    if (req.usuario._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'No puede desactivar su propia cuenta' });
    }

    usuario.activo = false;
    usuario.refreshToken = null;
    await usuario.save();

    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};

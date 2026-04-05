const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Organizacion = require('../models/Organizacion');

const generarAccessToken = (usuario) => {
  return jwt.sign(
    { _id: usuario._id, email: usuario.email, organizacionId: usuario.organizacionId, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generarRefreshToken = () => crypto.randomBytes(40).toString('hex');

// POST /api/auth/registro — Crea organización + usuario admin
exports.registro = async (req, res) => {
  try {
    const { email, password, nombre, apellido, organizacion } = req.body;

    if (!email || !password || !nombre || !organizacion?.nombre || !organizacion?.tipo) {
      return res.status(400).json({ error: 'Faltan campos requeridos: email, password, nombre, organizacion.nombre, organizacion.tipo' });
    }

    const existente = await Usuario.findOne({ email: email.toLowerCase() });
    if (existente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const org = await Organizacion.create({
      nombre: organizacion.nombre,
      tipo: organizacion.tipo,
      rut: organizacion.rut,
      direccion: organizacion.direccion,
      telefono: organizacion.telefono,
    });

    const rolAdmin = organizacion.tipo === 'empresa' ? 'empresa_admin' : 'centro_admin';
    const refreshToken = generarRefreshToken();

    const usuario = await Usuario.create({
      email,
      password,
      nombre,
      apellido,
      organizacionId: org._id,
      rol: rolAdmin,
      refreshToken: await bcrypt.hash(refreshToken, 10),
      ultimoAcceso: new Date(),
    });

    const accessToken = generarAccessToken(usuario);

    res.status(201).json({
      accessToken,
      refreshToken,
      usuario: { _id: usuario._id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
      organizacion: { _id: org._id, nombre: org.nombre, tipo: org.tipo },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase(), activo: true }).select('+password');
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const refreshToken = generarRefreshToken();
    usuario.refreshToken = await bcrypt.hash(refreshToken, 10);
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    const accessToken = generarAccessToken(usuario);

    res.json({
      accessToken,
      refreshToken,
      usuario: { _id: usuario._id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, organizacionId: usuario.organizacionId },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const usuarios = await Usuario.find({ activo: true }).select('+refreshToken');
    let usuarioEncontrado = null;

    for (const u of usuarios) {
      if (u.refreshToken && await bcrypt.compare(refreshToken, u.refreshToken)) {
        usuarioEncontrado = u;
        break;
      }
    }

    if (!usuarioEncontrado) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const nuevoRefreshToken = generarRefreshToken();
    usuarioEncontrado.refreshToken = await bcrypt.hash(nuevoRefreshToken, 10);
    await usuarioEncontrado.save();

    const accessToken = generarAccessToken(usuarioEncontrado);

    res.json({ accessToken, refreshToken: nuevoRefreshToken });
  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(500).json({ error: 'Error al renovar token' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await Usuario.findByIdAndUpdate(req.usuario._id, { refreshToken: null });
    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

// GET /api/auth/me — Retorna datos del usuario autenticado
exports.me = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).populate('organizacionId');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({
      _id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      organizacion: usuario.organizacionId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

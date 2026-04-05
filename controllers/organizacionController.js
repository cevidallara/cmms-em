const Organizacion = require('../models/Organizacion');
const RelacionOrganizaciones = require('../models/RelacionOrganizaciones');

// GET /api/organizaciones/mi-org
exports.miOrg = async (req, res) => {
  try {
    const org = await Organizacion.findById(req.usuario.organizacionId);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener organización' });
  }
};

// PUT /api/organizaciones/mi-org
exports.editarMiOrg = async (req, res) => {
  try {
    const camposPermitidos = ['nombre', 'rut', 'direccion', 'telefono'];
    const update = {};
    camposPermitidos.forEach(c => {
      if (req.body[c] !== undefined) update[c] = req.body[c];
    });

    const org = await Organizacion.findByIdAndUpdate(
      req.usuario.organizacionId,
      update,
      { new: true }
    );
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    res.json(org);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar organización' });
  }
};

// GET /api/organizaciones/centros — Empresa ve sus centros vinculados
exports.centrosVinculados = async (req, res) => {
  try {
    const relaciones = await RelacionOrganizaciones.find({
      empresaId: req.usuario.organizacionId,
      estado: 'activa',
    }).populate('centroId', 'nombre rut direccion telefono activa');

    res.json(relaciones.map(r => ({ ...r.centroId.toObject(), relacionId: r._id })));
  } catch (error) {
    res.status(500).json({ error: 'Error al listar centros vinculados' });
  }
};

// GET /api/organizaciones/empresas — Centro ve sus empresas vinculadas
exports.empresasVinculadas = async (req, res) => {
  try {
    const relaciones = await RelacionOrganizaciones.find({
      centroId: req.usuario.organizacionId,
      estado: 'activa',
    }).populate('empresaId', 'nombre rut direccion telefono activa');

    res.json(relaciones.map(r => ({ ...r.empresaId.toObject(), relacionId: r._id })));
  } catch (error) {
    res.status(500).json({ error: 'Error al listar empresas vinculadas' });
  }
};

// POST /api/organizaciones/relaciones — Vincular empresa ↔ centro
exports.vincular = async (req, res) => {
  try {
    const { empresaId, centroId } = req.body;
    if (!empresaId || !centroId) {
      return res.status(400).json({ error: 'empresaId y centroId son requeridos' });
    }

    // Validar que las orgs existen y tienen el tipo correcto
    const [empresa, centro] = await Promise.all([
      Organizacion.findById(empresaId),
      Organizacion.findById(centroId),
    ]);

    if (!empresa || empresa.tipo !== 'empresa') {
      return res.status(400).json({ error: 'empresaId no corresponde a una empresa válida' });
    }
    if (!centro || centro.tipo !== 'centro') {
      return res.status(400).json({ error: 'centroId no corresponde a un centro válido' });
    }

    // Verificar permisos: solo admin de la empresa, admin del centro, o superadmin
    const orgId = req.usuario.organizacionId?.toString();
    const esSuperadmin = req.usuario.rol === 'superadmin';
    const esAdminEmpresa = req.usuario.rol === 'empresa_admin' && orgId === empresaId;
    const esAdminCentro = req.usuario.rol === 'centro_admin' && orgId === centroId;

    if (!esSuperadmin && !esAdminEmpresa && !esAdminCentro) {
      return res.status(403).json({ error: 'No tiene permisos para crear esta relación' });
    }

    const relacion = await RelacionOrganizaciones.create({ empresaId, centroId });
    res.status(201).json(relacion);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Esta relación ya existe' });
    }
    res.status(500).json({ error: 'Error al vincular organizaciones' });
  }
};

// DELETE /api/organizaciones/relaciones/:id — Desvincular
exports.desvincular = async (req, res) => {
  try {
    const relacion = await RelacionOrganizaciones.findById(req.params.id);
    if (!relacion) return res.status(404).json({ error: 'Relación no encontrada' });

    // Verificar permisos
    const orgId = req.usuario.organizacionId?.toString();
    const esSuperadmin = req.usuario.rol === 'superadmin';
    const esParticipante = orgId === relacion.empresaId.toString() || orgId === relacion.centroId.toString();

    if (!esSuperadmin && !esParticipante) {
      return res.status(403).json({ error: 'No tiene permisos' });
    }

    await RelacionOrganizaciones.findByIdAndDelete(req.params.id);
    res.json({ message: 'Relación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desvincular organizaciones' });
  }
};

// --- Superadmin: listar todas las organizaciones ---
exports.listarTodas = async (req, res) => {
  try {
    const filter = {};
    if (req.query.tipo) filter.tipo = req.query.tipo;
    const orgs = await Organizacion.find(filter);
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar organizaciones' });
  }
};

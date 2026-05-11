const Repair = require('../models/Repair');
const RelacionOrganizaciones = require('../models/RelacionOrganizaciones');

// Centro users usan tenantFilterRepairs, el resto usa tenantFilter
const getFilter = (req) => req.tenantFilterRepairs || req.tenantFilter;

exports.getAll = async (req, res) => {
  try {
    const repairs = await Repair.find(getFilter(req))
      .populate('assetId')
      .populate('centroServicioId', 'nombre')
      .populate('asignadoA', 'nombre email');
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const repair = await Repair.findOne({ _id: req.params.id, ...getFilter(req) })
      .populate('assetId')
      .populate('centroServicioId', 'nombre')
      .populate('asignadoA', 'nombre email');
    if (!repair) return res.status(404).json({ error: 'Reparación no encontrada' });
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { centroServicioId } = req.body;

    // Si se asigna a un centro, validar que existe relación activa
    if (centroServicioId) {
      const relacion = await RelacionOrganizaciones.findOne({
        empresaId: req.usuario.organizacionId,
        centroId: centroServicioId,
        estado: 'activa',
      });
      if (!relacion && req.usuario.rol !== 'superadmin') {
        return res.status(400).json({ error: 'No existe relación activa con ese centro de servicio' });
      }
    }

    const data = {
      ...req.body,
      organizacionId: req.usuario.organizacionId,
      creadoPor: req.usuario._id,
    };
    const repair = await Repair.create(data);
    res.status(201).json(repair);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { rol } = req.usuario;
    const esCentro = rol === 'centro_admin' || rol === 'centro_tecnico';

    // Centro solo puede actualizar campos operativos, no reasignar
    if (esCentro) {
      const camposPermitidosCentro = ['progreso', 'estado', 'descripcion', 'tecnico', 'asignadoA', 'fechaDespacho'];
      const update = {};
      camposPermitidosCentro.forEach(c => {
        if (req.body[c] !== undefined) update[c] = req.body[c];
      });

      if (update.progreso === 'Despachado' && !update.fechaDespacho) {
        update.fechaDespacho = new Date();
      }

      const repair = await Repair.findOneAndUpdate(
        { _id: req.params.id, ...getFilter(req) },
        update,
        { returnDocument: "after" }
      );
      if (!repair) return res.status(404).json({ error: 'Reparación no encontrada' });
      return res.json(repair);
    }

    // Empresa/superadmin puede actualizar todo
    const repair = await Repair.findOneAndUpdate(
      { _id: req.params.id, ...getFilter(req) },
      req.body,
      { returnDocument: "after" }
    );
    if (!repair) return res.status(404).json({ error: 'Reparación no encontrada' });
    res.json(repair);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const repair = await Repair.findOneAndDelete({ _id: req.params.id, ...getFilter(req) });
    if (!repair) return res.status(404).json({ error: 'Reparación no encontrada' });
    res.json({ message: 'Reparación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

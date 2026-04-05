const Asset = require('../models/Asset');

exports.getAll = async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.esBackup !== undefined) filter.esBackup = req.query.esBackup === 'true';
    if (req.query.activoRelacionado) filter.activoRelacionado = req.query.activoRelacionado;
    const assets = await Asset.find(filter).populate('activoRelacionado');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      organizacionId: req.usuario.organizacionId,
      creadoPor: req.usuario._id,
    };
    const asset = await Asset.create(data);
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });
    res.json(asset);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getBackups = async (req, res) => {
  try {
    const filter = { esBackup: true, ...req.tenantFilter };
    if (req.params.assetId) filter.activoRelacionado = req.params.assetId;
    const backups = await Asset.find(filter).populate('activoRelacionado');
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });
    res.json({ message: 'Activo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

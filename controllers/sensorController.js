const Sensor = require('../models/Sensor');
const Asset = require('../models/Asset');

exports.list = async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.assetId) filter.assetId = req.query.assetId;
    if (req.query.provider) filter.provider = req.query.provider;
    const sensors = await Sensor.find(filter).populate('assetId', 'nombre tipo cliente sector');
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const sensor = await Sensor.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
    }).populate('assetId', 'nombre tipo cliente sector');
    if (!sensor) return res.status(404).json({ error: 'Sensor no encontrado' });
    res.json(sensor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { assetId, provider, externalId, type, config } = req.body;
    if (!assetId || !provider || !externalId) {
      return res.status(400).json({ error: 'assetId, provider y externalId son requeridos' });
    }

    // Verificar que el asset existe y pertenece a la org
    const asset = await Asset.findOne({ _id: assetId, ...req.tenantFilter });
    if (!asset) {
      return res.status(404).json({ error: 'Motor no encontrado' });
    }

    const sensor = await Sensor.create({
      organizacionId: req.usuario.organizacionId,
      assetId,
      provider,
      externalId: externalId.trim(),
      type: type || 'general',
      config: config || {},
      creadoPor: req.usuario._id,
    });
    res.status(201).json(sensor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Ya existe un sensor con ese externalId para ese provider' });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = ['type', 'config', 'status'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const sensor = await Sensor.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      update,
      { new: true }
    );
    if (!sensor) return res.status(404).json({ error: 'Sensor no encontrado' });
    res.json(sensor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const sensor = await Sensor.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantFilter,
    });
    if (!sensor) return res.status(404).json({ error: 'Sensor no encontrado' });
    res.json({ message: 'Sensor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

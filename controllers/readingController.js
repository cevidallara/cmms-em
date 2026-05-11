const Reading = require('../models/Reading');

exports.getAll = async (req, res) => {
  try {
    const readings = await Reading.find(req.tenantFilter).populate('assetId');
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const reading = await Reading.findOne({ _id: req.params.id, ...req.tenantFilter }).populate('assetId');
    if (!reading) return res.status(404).json({ error: 'Lectura no encontrada' });
    res.json(reading);
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
    const reading = await Reading.create(data);
    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const reading = await Reading.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!reading) return res.status(404).json({ error: 'Lectura no encontrada' });
    res.json(reading);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const reading = await Reading.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!reading) return res.status(404).json({ error: 'Lectura no encontrada' });
    res.json({ message: 'Lectura eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

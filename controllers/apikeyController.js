const ApiKey = require('../models/ApiKey');
const { generateApiKey } = require('../middleware/apiKeyAuth');

const VALID_SCOPES = ['ingest:write', 'read'];

exports.list = async (req, res) => {
  try {
    const keys = await ApiKey.find({
      organizacionId: req.usuario.organizacionId,
    })
      .select('-hashSha256')
      .sort({ createdAt: -1 });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, scopes } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    const requestedScopes = Array.isArray(scopes) && scopes.length > 0
      ? scopes.filter((s) => VALID_SCOPES.includes(s))
      : ['ingest:write', 'read'];

    const { plaintext, prefix, hash } = generateApiKey();

    const apiKey = await ApiKey.create({
      organizacionId: req.usuario.organizacionId,
      nombre: nombre.trim(),
      prefix,
      hashSha256: hash,
      scopes: requestedScopes,
      creadoPor: req.usuario._id,
    });

    // El plaintext SOLO se devuelve acá. Después no se puede recuperar.
    res.status(201).json({
      _id: apiKey._id,
      nombre: apiKey.nombre,
      prefix: apiKey.prefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      key: plaintext, // ← una sola vez
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.revoke = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, organizacionId: req.usuario.organizacionId },
      { revokedAt: new Date() },
      { returnDocument: "after" }
    ).select('-hashSha256');
    if (!apiKey) return res.status(404).json({ error: 'API key no encontrada' });
    res.json(apiKey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({
      _id: req.params.id,
      organizacionId: req.usuario.organizacionId,
    });
    if (!apiKey) return res.status(404).json({ error: 'API key no encontrada' });
    res.json({ message: 'API key eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

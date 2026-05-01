const crypto = require('node:crypto');
const ApiKey = require('../models/ApiKey');

const API_KEY_PREFIX = 'nik_live_';
const PREFIX_LENGTH = API_KEY_PREFIX.length + 4; // visible para mostrar al usuario

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function generateApiKey() {
  // 24 bytes → 32 caracteres base64url
  const random = crypto.randomBytes(24).toString('base64url');
  const plaintext = `${API_KEY_PREFIX}${random}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, PREFIX_LENGTH),
    hash: sha256(plaintext),
  };
}

/**
 * Middleware: autentica vía API key en header `Authorization: Bearer nik_live_xxx`.
 * Setea req.apiKey y req.organizacionId.
 */
async function apiKeyAuth(req, res, next) {
  try {
    const auth = req.header('authorization') || req.header('Authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'API key requerida en Authorization header' });
    }
    const key = auth.slice(7).trim();
    if (!key.startsWith(API_KEY_PREFIX)) {
      return res.status(401).json({ error: 'Formato de API key inválido' });
    }

    const hash = sha256(key);
    const record = await ApiKey.findOne({ hashSha256: hash, revokedAt: null });
    if (!record) {
      return res.status(401).json({ error: 'API key inválida o revocada' });
    }

    // Update lastUsedAt asincrónicamente
    ApiKey.updateOne({ _id: record._id }, { lastUsedAt: new Date() })
      .catch((err) => console.error('Failed to update API key lastUsedAt:', err.message));

    req.apiKey = record;
    req.organizacionId = record.organizacionId;
    req.tenantFilter = { organizacionId: record.organizacionId };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({ error: 'Error verificando API key' });
  }
}

function requireScope(scope) {
  return (req, res, next) => {
    if (!req.apiKey?.scopes?.includes(scope)) {
      return res.status(403).json({ error: `API key sin scope "${scope}"` });
    }
    next();
  };
}

module.exports = {
  apiKeyAuth,
  requireScope,
  generateApiKey,
  sha256,
  API_KEY_PREFIX,
  PREFIX_LENGTH,
};

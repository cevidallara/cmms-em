const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/ingestController');
const { apiKeyAuth, requireScope } = require('../middleware/apiKeyAuth');

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 600, // 10/seg promedio por API key
  // apiKeyAuth corre antes, así que req.apiKey siempre existe acá
  keyGenerator: (req) => req.apiKey._id.toString(),
  message: { error: 'Rate limit excedido (max 600/min por API key)' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', apiKeyAuth, requireScope('ingest:write'), ingestLimiter, controller.ingest);

module.exports = router;

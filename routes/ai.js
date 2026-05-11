const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { aiBudget } = require('../middleware/aiBudget');
const { tenantScope } = require('../middleware/tenantScope');
const { checkRole } = require('../middleware/checkRole');
const ai = require('../controllers/aiController');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas requests de IA, espera un momento' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adviseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas peticiones de análisis, espera un momento' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', chatLimiter, aiBudget, tenantScope, ai.chat);
router.post('/advise/motor/:motorId', adviseLimiter, aiBudget, tenantScope, ai.adviseMotor);
router.get('/usage', checkRole('superadmin', 'empresa_admin'), ai.usage);

module.exports = router;

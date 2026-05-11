const router = require('express').Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/onboardController');
const { aiBudget } = require('../middleware/aiBudget');

// Memory storage; archivos chicos (Excel < 5MB, foto < 10MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const onboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Demasiadas peticiones de onboarding' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/preview-spreadsheet', onboardLimiter, aiBudget, upload.single('file'), ctrl.previewSpreadsheet);
router.post('/import-spreadsheet', onboardLimiter, upload.single('file'), ctrl.importSpreadsheet);
router.post('/extract-nameplate', onboardLimiter, aiBudget, upload.single('file'), ctrl.extractNameplate);
router.post('/create-from-extraction', onboardLimiter, ctrl.createFromExtraction);

module.exports = router;

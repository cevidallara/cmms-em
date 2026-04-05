const express = require('express');
const router = express.Router();
const invitacionController = require('../controllers/invitacionController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');
const { aceptarInvitacionRules } = require('../middleware/validate');

// Aceptar invitación — público (no requiere auth)
router.post('/aceptar', aceptarInvitacionRules, invitacionController.aceptar);

// Rutas protegidas (requieren auth + rol admin)
router.post('/', auth, checkRole('empresa_admin', 'centro_admin', 'superadmin'), invitacionController.crear);
router.get('/', auth, checkRole('empresa_admin', 'centro_admin', 'superadmin'), invitacionController.listar);
router.delete('/:id', auth, checkRole('empresa_admin', 'centro_admin', 'superadmin'), invitacionController.cancelar);

module.exports = router;

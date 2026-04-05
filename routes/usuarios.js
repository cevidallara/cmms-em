const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { checkRole } = require('../middleware/checkRole');

// Listar usuarios de mi org (solo admins)
router.get('/', checkRole('empresa_admin', 'centro_admin', 'superadmin'), usuarioController.getAll);

// Detalle (admin o self — lógica de permisos en controller)
router.get('/:id', usuarioController.getById);

// Editar (admin o self — lógica de permisos en controller)
router.put('/:id', usuarioController.update);

// Desactivar (solo admins)
router.delete('/:id', checkRole('empresa_admin', 'centro_admin', 'superadmin'), usuarioController.deactivate);

module.exports = router;

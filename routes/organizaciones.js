const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizacionController');
const { checkRole } = require('../middleware/checkRole');

// Mi organización
router.get('/mi-org', orgController.miOrg);
router.put('/mi-org', checkRole('empresa_admin', 'centro_admin', 'superadmin'), orgController.editarMiOrg);

// Centros vinculados (empresa)
router.get('/centros', checkRole('empresa_admin', 'empresa_tecnico', 'superadmin'), orgController.centrosVinculados);

// Empresas vinculadas (centro)
router.get('/empresas', checkRole('centro_admin', 'centro_tecnico', 'superadmin'), orgController.empresasVinculadas);

// Vincular / desvincular
router.post('/relaciones', checkRole('empresa_admin', 'centro_admin', 'superadmin'), orgController.vincular);
router.delete('/relaciones/:id', checkRole('empresa_admin', 'centro_admin', 'superadmin'), orgController.desvincular);

// Superadmin: listar todas
router.get('/', checkRole('superadmin'), orgController.listarTodas);

module.exports = router;

const router = require('express').Router();
const controller = require('../controllers/assetController');

router.get('/', controller.getAll);
router.get('/backups', controller.getBackups);
router.get('/backups/:assetId', controller.getBackups);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;

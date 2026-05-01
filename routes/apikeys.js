const router = require('express').Router();
const controller = require('../controllers/apikeyController');

router.get('/', controller.list);
router.post('/', controller.create);
router.post('/:id/revoke', controller.revoke);
router.delete('/:id', controller.delete);

module.exports = router;

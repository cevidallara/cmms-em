const router = require('express').Router();
const ctrl = require('../controllers/anomalyController');

router.get('/', ctrl.list);
router.get('/counts', ctrl.counts);
router.post('/scan', ctrl.scan);
router.post('/:id/ack', ctrl.ack);
router.post('/:id/resolve', ctrl.resolve);
router.post('/:id/false-positive', ctrl.falsePositive);
router.post('/:id/narrate', ctrl.regenerateNarration);

module.exports = router;

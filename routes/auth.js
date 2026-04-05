const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { registroRules, loginRules } = require('../middleware/validate');

router.post('/registro', registroRules, authController.registro);
router.post('/login', loginRules, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.me);

module.exports = router;

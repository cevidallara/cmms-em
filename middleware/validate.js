const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registroRules = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
  body('organizacion.nombre').trim().notEmpty().withMessage('Nombre de organización es requerido'),
  body('organizacion.tipo').isIn(['empresa', 'centro']).withMessage('Tipo de organización debe ser empresa o centro'),
  handleValidation,
];

const loginRules = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Password es requerido'),
  handleValidation,
];

const aceptarInvitacionRules = [
  body('token').notEmpty().withMessage('Token es requerido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
  handleValidation,
];

module.exports = { registroRules, loginRules, aceptarInvitacionRules };

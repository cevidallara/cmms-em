const Organizacion = require('../models/Organizacion');
const { monthToDateCostUsd, isAvailable } = require('../services/aiClient');

/**
 * Bloquea la request si la org excede su budget mensual de IA.
 * Orden: override por org (Organizacion.aiBudgetUsd) > AI_BUDGET_PER_ORG_USD > sin límite.
 * El cap es soft: chequeamos antes de la call. Si una call larga la cruza, completa.
 */
async function aiBudget(req, res, next) {
  if (!isAvailable()) {
    return res.status(503).json({ error: 'IA no configurada en el servidor' });
  }

  // Superadmin no pertenece a una org: sin cap, uso global
  if (req.usuario?.rol === 'superadmin') {
    req.aiBudget = { capUsd: null, usedUsd: 0, remainingUsd: Infinity };
    return next();
  }

  const orgId = req.usuario?.organizacionId;
  if (!orgId) return res.status(403).json({ error: 'Usuario sin organización' });

  try {
    const org = await Organizacion.findById(orgId).select('aiBudgetUsd');
    const envCap = process.env.AI_BUDGET_PER_ORG_USD ? Number(process.env.AI_BUDGET_PER_ORG_USD) : null;
    const cap = org?.aiBudgetUsd ?? envCap;

    if (cap == null || cap <= 0) return next();

    const used = await monthToDateCostUsd(orgId);
    if (used >= cap) {
      return res.status(402).json({
        error: 'Cuota mensual de IA excedida',
        usedUsd: Number(used.toFixed(4)),
        capUsd: cap,
      });
    }

    req.aiBudget = { capUsd: cap, usedUsd: used, remainingUsd: cap - used };
    next();
  } catch (err) {
    console.error('aiBudget error:', err);
    res.status(500).json({ error: 'Error al verificar cuota de IA' });
  }
}

module.exports = { aiBudget };

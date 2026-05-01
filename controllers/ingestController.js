const { ingestOne } = require('../services/ingestService');

exports.ingest = async (req, res) => {
  try {
    const organizacionId = req.organizacionId;
    if (!organizacionId) {
      return res.status(401).json({ error: 'API key no asociada a una organización' });
    }

    const payloads = Array.isArray(req.body) ? req.body : [req.body];
    if (payloads.length === 0) {
      return res.status(400).json({ error: 'Body vacío' });
    }
    if (payloads.length > 100) {
      return res.status(413).json({ error: 'Máximo 100 lecturas por request' });
    }

    const results = await Promise.all(
      payloads.map((p) =>
        ingestOne(p, organizacionId, 'sensor').catch((err) => ({ ok: false, error: err.message }))
      )
    );

    const ingested = results.filter((r) => r.ok).length;
    const errors = results
      .map((r, i) => (r.ok ? null : { index: i, error: r.error }))
      .filter(Boolean);

    const status = ingested === payloads.length ? 200 : ingested > 0 ? 207 : 400;
    res.status(status).json({
      ingested,
      total: payloads.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: error.message });
  }
};

const xlsx = require('xlsx');
const Asset = require('../models/Asset');
const Organizacion = require('../models/Organizacion');
const {
  mapSpreadsheet,
  extractFromNameplate,
  applyMappingToRow,
} = require('../services/aiOnboarder');

const SAMPLE_ROWS_FOR_MAPPING = 5;
const MAX_IMPORT_ROWS = 500;
const SUPPORTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function parseSpreadsheet(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('El archivo no tiene hojas');
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
  if (!rows.length) throw new Error('La hoja está vacía');
  const headers = Object.keys(rows[0]);
  return { headers, rows };
}

async function resolveTargetOrgId(req) {
  // Si el body trae organizacionId explícito (superadmin pickeando org), usarlo.
  if (req.body?.organizacionId) {
    const org = await Organizacion.findById(req.body.organizacionId);
    if (!org) throw Object.assign(new Error('Organización no encontrada'), { status: 404 });
    return org._id;
  }
  if (req.usuario?.organizacionId) return req.usuario.organizacionId;
  // Superadmin sin org_id explícita: pedir que elija
  throw Object.assign(
    new Error('Como superadmin, especifica organizacionId en el body para importar.'),
    { status: 400 }
  );
}

exports.previewSpreadsheet = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
    const { headers, rows } = parseSpreadsheet(req.file.buffer);

    const ctx = { organizacionId: req.usuario.organizacionId, userId: req.usuario._id };
    const mapping = await mapSpreadsheet({
      headers,
      sampleRows: rows.slice(0, SAMPLE_ROWS_FOR_MAPPING),
      ctx,
    });

    res.json({
      headers,
      totalRows: rows.length,
      sampleRows: rows.slice(0, SAMPLE_ROWS_FOR_MAPPING),
      // No devolvemos todas las filas todavía (puede ser pesado); el cliente las re-sube al importar.
      mapping,
    });
  } catch (err) {
    console.error('previewSpreadsheet:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error al procesar archivo' });
  }
};

exports.importSpreadsheet = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
    if (!mapping?.columnMappings) return res.status(400).json({ error: 'mapping inválido' });
    const dryRun = req.body.dryRun === 'true' || req.body.dryRun === true;

    const { rows } = parseSpreadsheet(req.file.buffer);
    if (rows.length > MAX_IMPORT_ROWS) {
      return res.status(400).json({ error: `Máximo ${MAX_IMPORT_ROWS} filas por import` });
    }

    const orgId = await resolveTargetOrgId(req);

    const results = { created: 0, skipped: 0, errors: [] };
    const docs = [];
    for (let i = 0; i < rows.length; i++) {
      const mapped = applyMappingToRow(rows[i], mapping.columnMappings, mapping.defaultValues || {});
      if (!mapped.nombre || !mapped.tipo || !mapped.cliente) {
        results.skipped++;
        results.errors.push({ row: i + 2, reason: 'falta nombre, tipo o cliente' });
        continue;
      }
      docs.push({
        ...mapped,
        organizacionId: orgId,
        creadoPor: req.usuario._id,
      });
    }

    if (!dryRun && docs.length) {
      const created = await Asset.insertMany(docs, { ordered: false });
      results.created = created.length;
    } else {
      results.created = docs.length; // dry run: cuántos se hubieran creado
    }

    res.json({ ...results, dryRun, totalRows: rows.length });
  } catch (err) {
    console.error('importSpreadsheet:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error al importar' });
  }
};

exports.extractNameplate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta imagen' });
    if (!SUPPORTED_IMAGE_MIMES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `Formato no soportado: ${req.file.mimetype}` });
    }
    const ctx = { organizacionId: req.usuario.organizacionId, userId: req.usuario._id };
    const specs = await extractFromNameplate({
      imageBase64: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype,
      ctx,
    });
    res.json({ specs });
  } catch (err) {
    console.error('extractNameplate:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error al extraer' });
  }
};

exports.createFromExtraction = async (req, res) => {
  try {
    const { specs, organizacionId: targetOrgId, cliente, sector } = req.body || {};
    if (!specs?.nombre && !req.body.nombre) {
      return res.status(400).json({ error: 'nombre es requerido' });
    }
    const orgId = await resolveTargetOrgId(req);

    const doc = {
      nombre: req.body.nombre || specs.nombre,
      tipo: req.body.tipo || specs.tipo || 'Motor eléctrico',
      marca: specs.marca,
      modelo: specs.modelo,
      numeroSerie: specs.numeroSerie,
      potenciaKW: specs.potenciaKW,
      cliente: cliente || req.body.cliente || 'Sin asignar',
      sector: sector || req.body.sector,
      organizacionId: orgId,
      creadoPor: req.usuario._id,
    };

    const asset = await Asset.create(doc);
    res.status(201).json(asset);
  } catch (err) {
    console.error('createFromExtraction:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error al crear motor' });
  }
};

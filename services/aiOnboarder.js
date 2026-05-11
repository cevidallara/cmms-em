const { getClient, recordUsage, HEAVY_MODEL } = require('./aiClient');

// Campos del modelo Asset que se pueden mapear desde una fuente externa.
const ASSET_TARGET_FIELDS = [
  'nombre', 'tipo', 'modelo', 'marca', 'numeroSerie',
  'potenciaKW', 'cliente', 'sector', 'ubicacion',
  'estadoActual', 'categoria', 'subcategoria',
  'esBackup', 'proveedor', 'fechaAdquisicion', 'costo',
];

const TIPOS_VALIDOS = ['Motor eléctrico', 'Bomba', 'Compresor', 'Ventilador', 'Otro'];

const MAPPING_TOOL = {
  name: 'submit_mapping',
  description: 'Devuelve el mapeo de columnas del spreadsheet del usuario a los campos del modelo Asset de Nikolator.',
  input_schema: {
    type: 'object',
    properties: {
      columnMappings: {
        type: 'array',
        description: 'Una entrada por columna del spreadsheet. Si una columna no aplica a ningún campo, omitirla.',
        items: {
          type: 'object',
          properties: {
            sourceColumn: { type: 'string', description: 'Nombre exacto de la columna en el spreadsheet.' },
            targetField: {
              type: 'string',
              enum: ASSET_TARGET_FIELDS,
              description: 'Campo del modelo Asset al que mapea.',
            },
            transformation: {
              type: 'string',
              enum: ['none', 'hp_to_kw', 'parse_number', 'trim', 'parse_date', 'normalize_tipo'],
              description: 'Transformación a aplicar. hp_to_kw multiplica por 0.7457. parse_number quita unidades/símbolos. normalize_tipo mapea variantes a Motor eléctrico/Bomba/Compresor/Ventilador/Otro.',
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['sourceColumn', 'targetField', 'transformation'],
        },
      },
      defaultValues: {
        type: 'object',
        description: 'Pares campo→valor a aplicar a TODOS los motores. Solo si el spreadsheet no trae ese dato pero se infiere del contexto (ej: todas las filas son del mismo cliente).',
        properties: {},
      },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        description: 'Avisos para el usuario (ej: "no detecté columna de potencia, agregá manual").',
      },
      detectedRowCountColumn: {
        type: 'string',
        description: 'Si el spreadsheet tiene una columna que indica cantidad de motores por fila, su nombre. Si cada fila es un motor, dejar vacío.',
      },
    },
    required: ['columnMappings', 'warnings'],
  },
};

const NAMEPLATE_TOOL = {
  name: 'submit_motor_specs',
  description: 'Devuelve los specs extraídos de la foto de placa del motor.',
  input_schema: {
    type: 'object',
    properties: {
      nombre: { type: 'string', description: 'Si la placa tiene un identificador/tag visible, usalo. Si no, omitir.' },
      marca: { type: 'string' },
      modelo: { type: 'string' },
      numeroSerie: { type: 'string' },
      tipo: { type: 'string', enum: TIPOS_VALIDOS },
      potenciaKW: { type: 'number', description: 'En kW. Convertí HP→kW si la placa lo da en HP (×0.7457).' },
      voltajeNominal: { type: 'number', description: 'Voltaje nominal de operación.' },
      corrienteNominal: { type: 'number' },
      rpm: { type: 'number' },
      frecuencia: { type: 'number', description: 'Hz' },
      claseIE: { type: 'string', enum: ['IE1', 'IE2', 'IE3', 'IE4'] },
      ipRating: { type: 'string', description: 'ej: IP55' },
      pesoKg: { type: 'number' },
      confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confianza global de la extracción.' },
      campoIlegibles: {
        type: 'array',
        items: { type: 'string' },
        description: 'Campos que están en la placa pero no se pueden leer con confianza.',
      },
    },
    required: ['confidence'],
  },
};

async function mapSpreadsheet({ headers, sampleRows, ctx }) {
  const client = getClient();
  if (!client) throw Object.assign(new Error('IA no configurada'), { status: 503 });

  const prompt = [
    `Mapea las columnas de este spreadsheet a campos del modelo Asset de Nikolator.`,
    ``,
    `Campos disponibles del modelo Asset:`,
    `- nombre (string, requerido): identificador del motor (ej: "Motor M-210", "Bomba P-3").`,
    `- tipo (string, requerido): uno de ${TIPOS_VALIDOS.join(', ')}.`,
    `- marca, modelo, numeroSerie (strings).`,
    `- potenciaKW (número en kW; convertir si está en HP).`,
    `- cliente (planta/dueño), sector, ubicacion (strings).`,
    `- estadoActual: Operativo, En reparación, Fuera de servicio, Standby.`,
    `- categoria, subcategoria, proveedor (strings).`,
    `- esBackup (boolean).`,
    `- costo (número), fechaAdquisicion (string ISO).`,
    ``,
    `## Headers detectados`,
    headers.map((h, i) => `${i + 1}. "${h}"`).join('\n'),
    ``,
    `## Primeras filas (sample)`,
    JSON.stringify(sampleRows.slice(0, 5), null, 2),
    ``,
    `Reglas:`,
    `- Si una columna no aplica, no la incluyas en columnMappings.`,
    `- Si la potencia está en HP, marca transformation hp_to_kw.`,
    `- Si una columna trae unidades en el header (ej: "Pot. (HP)") pero el value es solo número, igual usá hp_to_kw.`,
    `- Si todas las filas tienen el mismo cliente o sector, podés ponerlo en defaultValues en vez de mapping.`,
    `- Llama submit_mapping exactamente UNA vez.`,
  ].join('\n');

  const startedAt = Date.now();
  const message = await client.messages.create({
    model: HEAVY_MODEL,
    max_tokens: 1500,
    tools: [MAPPING_TOOL],
    tool_choice: { type: 'tool', name: 'submit_mapping' },
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - startedAt;

  await recordUsage({
    orgId: ctx?.organizacionId,
    userId: ctx?.userId,
    endpoint: 'onboard/spreadsheet',
    model: HEAVY_MODEL,
    usage: message.usage,
    latencyMs,
  });

  const toolUse = (message.content || []).find(b => b.type === 'tool_use');
  if (!toolUse?.input) throw new Error('Modelo no devolvió mapping estructurado');
  return toolUse.input;
}

async function extractFromNameplate({ imageBase64, mimeType, ctx }) {
  const client = getClient();
  if (!client) throw Object.assign(new Error('IA no configurada'), { status: 503 });

  const prompt = `Extrae los specs visibles en la placa de identificación de este motor industrial.

Reglas:
- Solo reportá lo que LEAS en la imagen. No inventes.
- Si la potencia está en HP, convertilo a kW (HP × 0.7457).
- Si un campo está borroso o tapado, omitílo y agregalo a campoIlegibles.
- confidence global: 0.9+ si la placa es legible y completa, 0.6 si parcial, <0.4 si está mal.
- Llama submit_motor_specs exactamente UNA vez.`;

  const startedAt = Date.now();
  const message = await client.messages.create({
    model: HEAVY_MODEL,
    max_tokens: 800,
    tools: [NAMEPLATE_TOOL],
    tool_choice: { type: 'tool', name: 'submit_motor_specs' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });
  const latencyMs = Date.now() - startedAt;

  await recordUsage({
    orgId: ctx?.organizacionId,
    userId: ctx?.userId,
    endpoint: 'onboard/nameplate',
    model: HEAVY_MODEL,
    usage: message.usage,
    latencyMs,
  });

  const toolUse = (message.content || []).find(b => b.type === 'tool_use');
  if (!toolUse?.input) throw new Error('Modelo no devolvió specs estructurados');
  return toolUse.input;
}

// ---------- Transformaciones aplicadas server-side al importar ----------

const TIPO_NORMALIZER = {
  motor: 'Motor eléctrico',
  'motor electrico': 'Motor eléctrico',
  'motor eléctrico': 'Motor eléctrico',
  electromotor: 'Motor eléctrico',
  bomba: 'Bomba',
  'bomba sumergible': 'Bomba',
  'bomba centrifuga': 'Bomba',
  electrobomba: 'Bomba',
  compresor: 'Compresor',
  ventilador: 'Ventilador',
  axial: 'Ventilador',
  centrifugo: 'Ventilador',
};

function applyTransformation(value, transformation) {
  if (value == null || value === '') return undefined;
  switch (transformation) {
    case 'hp_to_kw': {
      const n = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
      return Number.isFinite(n) ? Number((n * 0.7457).toFixed(2)) : undefined;
    }
    case 'parse_number': {
      const n = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : undefined;
    }
    case 'trim':
      return String(value).trim();
    case 'parse_date': {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    case 'normalize_tipo': {
      const key = String(value).trim().toLowerCase();
      return TIPO_NORMALIZER[key] || (TIPOS_VALIDOS.includes(value) ? value : 'Otro');
    }
    case 'none':
    default:
      return value;
  }
}

function applyMappingToRow(row, columnMappings, defaultValues = {}) {
  const out = { ...defaultValues };
  for (const m of columnMappings) {
    const raw = row[m.sourceColumn];
    const transformed = applyTransformation(raw, m.transformation || 'none');
    if (transformed !== undefined) out[m.targetField] = transformed;
  }
  return out;
}

module.exports = {
  mapSpreadsheet,
  extractFromNameplate,
  applyMappingToRow,
  applyTransformation,
  ASSET_TARGET_FIELDS,
  TIPOS_VALIDOS,
};

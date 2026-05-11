const {
  getClient,
  recordUsage,
  monthToDateCostUsd,
  DEFAULT_MODEL,
  HEAVY_MODEL,
  buildSystemPrompt,
} = require('../services/aiClient');
const { TOOL_DEFS, runTool } = require('../services/aiTools');
const { getOrComputeAdvice } = require('../services/aiAdvisor');
const AiUsage = require('../models/AiUsage');

const ALLOWED_MODELS = new Set([DEFAULT_MODEL, HEAVY_MODEL]);
const MAX_TOOL_TURNS = 6;

function sseHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write('retry: 5000\n\n');
}

function sseSend(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function summarizeToolResult(result) {
  if (!result || typeof result !== 'object') return null;
  if (result.error) return { error: result.error };
  // Resúmenes ligeros para mostrar en UI sin pegar todo el payload
  const out = {};
  if (typeof result.count === 'number') out.count = result.count;
  if (result.totalMotores !== undefined) out.totalMotores = result.totalMotores;
  if (result.motor?.nombre) out.motor = result.motor.nombre;
  if (result.summary?.count !== undefined) out.lecturas = result.summary.count;
  if (result.rangoDias) out.rangoDias = result.rangoDias;
  return Object.keys(out).length ? out : { ok: true };
}

/**
 * POST /api/ai/chat
 * Body: { messages: [{role, content}, ...], model?: string }
 * Stream SSE:
 *   event=connected   { model }
 *   event=token       { text }
 *   event=tool_call   { id, name, input }
 *   event=tool_result { id, name, summary }
 *   event=turn_done   { stopReason, usage }
 *   event=done        { totalUsage, latencyMs, turns }
 *   event=error       { error }
 */
exports.chat = async (req, res) => {
  const { messages: incoming, model: requestedModel } = req.body || {};
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'messages debe ser un array no vacío' });
  }

  // Default a Sonnet (HEAVY) porque tool use con Haiku es menos confiable.
  const model = requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : HEAVY_MODEL;
  const client = getClient();
  if (!client) return res.status(503).json({ error: 'IA no configurada' });

  sseHeaders(res);
  sseSend(res, 'connected', { ts: Date.now(), model });

  const heartbeat = setInterval(() => {
    try { res.write(`:hb ${Date.now()}\n\n`); } catch { clearInterval(heartbeat); }
  }, 30_000);

  let aborted = false;
  let activeStream = null;
  req.on('close', () => {
    aborted = true;
    clearInterval(heartbeat);
    try { activeStream?.controller?.abort(); } catch { /* noop */ }
  });

  const ctx = {
    tenantFilter: req.tenantFilter || { organizacionId: req.usuario.organizacionId },
    organizacionId: req.usuario.organizacionId,
    userId: req.usuario._id,
  };

  // Si tenantScope no corrió (no está en el chain de la ruta), construyo uno por org.
  // /api/ai/chat usa solo `auth`, no `tenantScope` — así que defaulteamos al filtro por org.

  const startedAt = Date.now();
  const totalUsage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  const conversation = incoming.slice();
  let turns = 0;

  try {
    while (turns < MAX_TOOL_TURNS) {
      if (aborted) break;
      turns++;

      activeStream = client.messages.stream({
        model,
        max_tokens: 2048,
        system: [
          { type: 'text', text: buildSystemPrompt(), cache_control: { type: 'ephemeral' } },
        ],
        tools: TOOL_DEFS,
        messages: conversation,
      });

      for await (const event of activeStream) {
        if (aborted) break;
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          sseSend(res, 'token', { text: event.delta.text });
        }
      }
      if (aborted) break;

      const final = await activeStream.finalMessage();

      // Acumular usage para tracking
      for (const k of Object.keys(totalUsage)) {
        totalUsage[k] += final.usage?.[k] || 0;
      }
      await recordUsage({
        orgId: ctx.organizacionId,
        userId: ctx.userId,
        endpoint: 'chat',
        model,
        usage: final.usage,
        latencyMs: Date.now() - startedAt,
      });
      sseSend(res, 'turn_done', { stopReason: final.stop_reason, usage: final.usage });

      // Push assistant message a la conversación
      conversation.push({ role: 'assistant', content: final.content });

      if (final.stop_reason !== 'tool_use') break;

      // Ejecutar todas las tool_use de este turno
      const toolUses = final.content.filter(b => b.type === 'tool_use');
      const toolResults = [];
      for (const tu of toolUses) {
        if (aborted) break;
        sseSend(res, 'tool_call', { id: tu.id, name: tu.name, input: tu.input });
        const result = await runTool(tu.name, tu.input, ctx);
        sseSend(res, 'tool_result', {
          id: tu.id,
          name: tu.name,
          summary: summarizeToolResult(result),
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        });
      }
      if (aborted) break;
      conversation.push({ role: 'user', content: toolResults });
    }

    if (!aborted) {
      sseSend(res, 'done', {
        totalUsage,
        latencyMs: Date.now() - startedAt,
        turns,
      });
    }
  } catch (err) {
    console.error('aiController.chat error:', err);
    if (!aborted) sseSend(res, 'error', { error: err.message || 'Error de IA' });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
};

/**
 * POST /api/ai/advise/motor/:motorId
 * Body opcional: { force: boolean } para invalidar cache.
 * Devuelve { advice, cached, computedAt }.
 */
exports.adviseMotor = async (req, res) => {
  try {
    const ctx = {
      tenantFilter: req.tenantFilter || { organizacionId: req.usuario.organizacionId },
      organizacionId: req.usuario.organizacionId,
      userId: req.usuario._id,
    };
    const { advice, cached } = await getOrComputeAdvice(
      req.params.motorId,
      ctx,
      { force: Boolean(req.body?.force) }
    );
    res.json({ advice, cached, computedAt: advice.computedAt });
  } catch (err) {
    console.error('aiController.adviseMotor error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Error al generar análisis' });
  }
};

/**
 * GET /api/ai/usage — totales del mes corriente para la org.
 */
exports.usage = async (req, res) => {
  try {
    const orgId = req.usuario.organizacionId;
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [byModel, total] = await Promise.all([
      AiUsage.aggregate([
        { $match: { organizacionId: orgId, createdAt: { $gte: start } } },
        {
          $group: {
            _id: '$model',
            calls: { $sum: 1 },
            inputTokens: { $sum: '$inputTokens' },
            outputTokens: { $sum: '$outputTokens' },
            cacheReadTokens: { $sum: '$cacheReadTokens' },
            cacheCreationTokens: { $sum: '$cacheCreationTokens' },
            costUsd: { $sum: '$costUsd' },
          },
        },
      ]),
      monthToDateCostUsd(orgId),
    ]);

    res.json({
      periodStart: start.toISOString(),
      totalUsd: Number(total.toFixed(4)),
      byModel: byModel.map(m => ({
        model: m._id,
        calls: m.calls,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        cacheReadTokens: m.cacheReadTokens,
        cacheCreationTokens: m.cacheCreationTokens,
        costUsd: Number(m.costUsd.toFixed(4)),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

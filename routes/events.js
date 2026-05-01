const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { subscribe } = require('../services/eventBus');

/**
 * Server-Sent Events. Auth vía query param ?token=<jwt>
 * (EventSource no permite custom headers).
 *
 * Eventos emitidos:
 *   - reading.created  cuando se crea una lectura en la org del usuario
 *
 * Heartbeat cada 30s para mantener viva la conexión.
 */
router.get('/', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).end('Token requerido (query param ?token=)');
  }

  let payload;
  try {
    payload = jwt.verify(String(token), process.env.JWT_SECRET);
  } catch {
    return res.status(401).end('Token inválido o expirado');
  }

  const organizacionId = payload.organizacionId;
  if (!organizacionId) {
    return res.status(403).end('Usuario sin organización');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx, Render)
  });
  res.flushHeaders?.();
  res.write('retry: 5000\n\n');
  res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

  const unsubscribe = subscribe(organizacionId, (event) => {
    try {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
    } catch (err) {
      console.error('SSE write error:', err.message);
    }
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(`:hb ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };
  req.on('close', cleanup);
  req.on('error', cleanup);
});

module.exports = router;

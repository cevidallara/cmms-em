require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const { auth } = require('./middleware/auth');
const { tenantScope } = require('./middleware/tenantScope');

// --- Validación de variables de entorno críticas ---
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  process.exit(1);
}

// --- CORS ---
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:3001', 'http://localhost:3002'];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos, intente de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
connectDB();

app.set('trust proxy', 1); // Render / Vercel ponen un reverse proxy adelante

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// --- Healthcheck (sin auth, sin rate limit) ---
app.get('/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'degraded',
    db: dbReady,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.RENDER_GIT_COMMIT || 'dev',
  });
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/usuarios', auth, require('./routes/usuarios'));
app.use('/api/invitaciones', require('./routes/invitaciones'));
app.use('/api/organizaciones', auth, require('./routes/organizaciones'));
app.use('/api/assets', auth, tenantScope, require('./routes/assets'));
app.use('/api/repairs', auth, tenantScope, require('./routes/repairs'));
app.use('/api/readings', auth, tenantScope, require('./routes/readings'));

// --- 404 fallback ---
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// --- Error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Nikolator backend corriendo en puerto ${PORT}`);
  console.log(`🔓 CORS origins: ${corsOrigins.join(', ')}`);
});

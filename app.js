require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const { auth } = require('./middleware/auth');
const { tenantScope } = require('./middleware/tenantScope');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { error: 'Demasiados intentos, intente de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/usuarios', auth, require('./routes/usuarios'));
app.use('/api/invitaciones', require('./routes/invitaciones'));
app.use('/api/organizaciones', auth, require('./routes/organizaciones'));
app.use('/api/assets', auth, tenantScope, require('./routes/assets'));
app.use('/api/repairs', auth, tenantScope, require('./routes/repairs'));
app.use('/api/readings', auth, tenantScope, require('./routes/readings'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

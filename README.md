# Nikolator

Eficiencia energética y gestión de mantenimiento para flotas de motores eléctricos industriales.

Multi-tenant SaaS con backend Node/Express + MongoDB y frontend Next.js 16 + Tailwind v4.

## Estructura

```
.
├── app.js, models/, controllers/, routes/   # Backend (Express + Mongoose)
├── frontend/                                # Frontend Next.js (App Router)
├── frontend-legacy/                         # CRA viejo, dejado como referencia hasta cierre de migración
├── render.yaml                              # Blueprint para Render
├── Dockerfile                               # Imagen del backend
└── .github/workflows/ci.yml                 # Pipeline de CI
```

## Desarrollo local

### Pre-requisitos
- Node 20+
- MongoDB Atlas (con tu IP whitelist-eada)
- `cp .env.example .env` y completar valores

### Backend
```bash
npm install
npm run seed:superadmin   # Crea admin@cmms-em.com / Admin123! la primera vez
npm run dev               # node --watch app.js → :3000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev -- -p 3001    # → :3001
```

## Deploy en Render

El repo incluye `render.yaml` con dos servicios — backend y frontend.

1. **Atlas**: agregar `0.0.0.0/0` en Network Access (o las IPs de Render) para que ambos servicios puedan conectar.
2. **Render**: New → Blueprint → conectar el repo. Render detecta `render.yaml` y crea ambos servicios.
3. Completar las env vars marcadas `sync: false` en el dashboard de Render:
   - **nikolator-backend**: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (URL pública del frontend), `SENTRY_DSN` (opcional)
   - **nikolator-app**: `NEXT_PUBLIC_API_URL` (URL pública del backend con `/api` al final)
4. Deploy → backend levanta en `https://nikolator-backend.onrender.com`, frontend en `https://nikolator-app.onrender.com`.
5. Volver al backend y actualizar `CORS_ORIGIN` con la URL real del frontend.

### Healthcheck
`GET /health` devuelve estado del servicio + conexión a MongoDB. Render lo usa para no enviar tráfico hasta que esté listo.

## CI

Cada push a `main` (y cada PR) corre el workflow `.github/workflows/ci.yml`:
- **Frontend**: `tsc --noEmit`, `eslint`, `next build`
- **Backend**: syntax check de `app.js` + smoke boot

Render auto-deploya cuando el push a `main` pasa CI (configurable).

## Variables de entorno

Ver `.env.example` (backend) y `frontend/.env.example` (frontend) para la lista completa con valores de ejemplo.

# Plan — Deploy a Render (W8)

**Estado:** listo para ejecutar — 8 commits locales W1→W8, falta `git push` y setup en Render.

## Pre-deploy ya cerrado

- Backend: `/health`, env validation, CORS configurable, 404+error handler, `trust proxy 1`
- Frontend: build limpio (13 rutas), 404 page, mobile drawer, animaciones, skeletons, errors, onboarding
- `render.yaml` blueprint con backend + frontend
- `.github/workflows/ci.yml` (typecheck + eslint + next build + backend smoke boot)
- Dockerfile actualizado a Node 20
- README documenta el flujo

## Pasos a ejecutar

### 1. Push al remoto (1 min)
```bash
git push origin main
```
Dispara CI por primera vez.

### 2. MongoDB Atlas (3 min)
- Network Access → `0.0.0.0/0` (en plan free; en pago se puede whitelist las Outbound IPs de Render)
- Recomendado: cluster separado para prod, no reusar el de dev
- Copiar connection string

### 3. Generar JWT_SECRET de prod (1 min)
```bash
openssl rand -base64 64
```
**No reusar** el de `.env` local.

### 4. Render Blueprint (10 min)
- dashboard.render.com → **New** → **Blueprint**
- Conectar repo `cevidallara/cmms-em`
- Render detecta `render.yaml` → Apply

### 5. Env vars (5 min)

**nikolator-backend:**
| Key | Value |
|---|---|
| `MONGODB_URI` | connection string de Atlas |
| `JWT_SECRET` | output de openssl |
| `CORS_ORIGIN` | dejar vacío, completar en paso 6 |
| `SENTRY_DSN` | dejar vacío (no implementado) |

**nikolator-app:**
| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://nikolator-backend-XXXX.onrender.com/api` |

### 6. Resolver chicken-and-egg de CORS (5 min)
- Esperar primer deploy
- Tomar URL real del frontend
- Volver al backend → editar `CORS_ORIGIN` con la URL del frontend
- Backend auto-redeploya

### 7. Seed superadmin (2 min)
Render → `nikolator-backend` → **Shell**:
```bash
npm run seed:superadmin
```
Crea `admin@cmms-em.com` / `Admin123!`. Cambiar password inmediatamente.

### 8. Smoke test (5 min)
1. Login con superadmin
2. Registro de nuevo usuario/org
3. Crear motor → cargar lectura → dashboard
4. Crear reparación → mover por kanban
5. Crear centro → asignar reparación → ver badge en kanban

## Riesgos a tener en mente

- **Free tier spin-down** (Render): 15 min de inactividad → 30-60 s en wake. Para demo del lead, subir a Starter ($7/mes c/u, total $14/mes) y prender el día anterior.
- **Atlas M0 free**: 512 MB y sin backups automáticos. OK para demo, upgrade a M2 ($9/mes) antes del primer cliente real.
- **Mock data por browser**: switchovers, centros, repair-centro mappings viven en localStorage. Para demos abrir desde tu browser. Migrar a backend cuando firme primer cliente.
- **Sentry sin SDK**: el slot del env var existe pero no hay init. ~15 min para conectar (`@sentry/node` backend, `@sentry/nextjs` frontend).
- **Custom domain**: Render auto-SSL. Cuando compres `nikolator.com` → Render Settings → Custom Domains → CNAME en DNS. ~10 min.
- **CI no bloquea deploy**: Render auto-deploya en push aunque CI falle. Para gating, configurar manual deploys + GitHub Action que dispare. No crítico v1.
- **Rebuild del frontend al cambiar API URL**: `NEXT_PUBLIC_API_URL` se hornea en build. Cambio de URL = redeploy manual del frontend.

## Cleanup opcional post-deploy

- Eliminar `frontend-legacy/` (~10 MB, fuera de uso desde W1):
  ```bash
  rm -rf frontend-legacy/ && git add -A && git commit -m "chore: drop frontend-legacy"
  ```

## Tiempo total estimado
**45–60 min** desde push hasta URL pública demoable.

# Plan — Salida a producción (post Sensors MVP)

**Estado:** todo el código listo en local. Commits W1→W11 + W8 infra. Falta `git push` y setup en Render.

> Reemplaza al plan original `deploy-w8.md` ahora que MQTT + SSE están integrados.

## Qué se va a producción

- App web Next.js (motores, reparaciones, lecturas, comparador costo/beneficio, backups, centros, integraciones)
- API REST con multi-tenancy (motores, reparaciones, lecturas, sensores, API keys)
- **Endpoint canónico de ingesta** `/api/ingest` con auth por API key + rate limit
- **MQTT subscriber** con topic pattern `nikolator/<orgId>/<externalId>/reading`
- **Server-Sent Events** `/api/events` para dashboard en tiempo real
- Healthcheck `/health`, env validation, CORS configurable, 404 handler

## Decisiones críticas para producción

### Render: Starter plan, NO free
Free tier hace spin-down después de 15 min de inactividad → mata la conexión MQTT y las SSE. Para que sensores en vivo funcionen 24/7, **backend en Starter ($7/mes)**. Frontend puede quedar en free (es solo serving SSR + estático).

**Costo mensual mínimo:** $7 USD (backend Starter).
**Recomendado:** $14 USD (backend + frontend Starter, ambos warm).

### MQTT broker: HiveMQ Cloud free tier
- 100 conexiones simultáneas, 10 GB/mes de tráfico
- mqtts:// (TLS), puerto 8883
- Suficiente para 100 sensores en demo + primeros clientes
- Migrar a EMQX self-hosted o plan pago cuando escale

### MongoDB Atlas: M0 free para demo, M2 antes de cliente real
- M0: 512 MB, sin backups automáticos
- M2: 2 GB + backups diarios, $9/mes

## Pasos a ejecutar

### 1. Push al remoto (1 min)
```bash
git push origin main
```
Dispara CI por primera vez con código de W1–W11.

### 2. Crear cuenta HiveMQ Cloud (5 min)
- https://www.hivemq.com/mqtt-cloud-broker/
- Sign up → Create cluster → Free tier
- Crear credentials → guardar `BROKER_HOST`, `USERNAME`, `PASSWORD`
- URL formato: `mqtts://CLUSTER_ID.s1.eu.hivemq.cloud:8883`

### 3. MongoDB Atlas (3 min)
- Network Access → `0.0.0.0/0` (free tier; en pago whitelist Render IPs)
- Cluster separado para prod recomendado (no reusar dev)
- Connection string para `MONGODB_URI`

### 4. Generar JWT_SECRET (1 min)
```bash
openssl rand -base64 64
```

### 5. Render Blueprint (10 min)
- dashboard.render.com → New → Blueprint → conectar `cevidallara/cmms-em`
- Detecta `render.yaml` → Apply
- **Cambiar plan de backend a Starter** desde Settings (no free)

### 6. Set env vars en Render (8 min)

**`nikolator-backend`** (todas marcadas `sync: false`):

| Key | Value |
|---|---|
| `MONGODB_URI` | connection string Atlas |
| `JWT_SECRET` | output de openssl |
| `CORS_ORIGIN` | dejar vacío inicialmente |
| `MQTT_BROKER_URL` | `mqtts://CLUSTER.s1.eu.hivemq.cloud:8883` |
| `MQTT_USERNAME` | usuario HiveMQ |
| `MQTT_PASSWORD` | password HiveMQ |
| `SENTRY_DSN` | vacío (no implementado todavía) |

**`nikolator-app`**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://nikolator-backend-XXXX.onrender.com/api` |

### 7. Resolver chicken-and-egg de CORS (5 min)
- Esperar primer deploy de ambos servicios
- Tomar URL real del frontend
- Backend → editar `CORS_ORIGIN` con la URL del frontend (Render auto-redeploya)

### 8. Verificar healthcheck + MQTT + SSE (3 min)

```bash
# Healthcheck
curl https://nikolator-backend-XXXX.onrender.com/health

# Logs en Render dashboard deben mostrar:
# 🚀 Nikolator backend corriendo
# ✅ MongoDB conectado
# 🛰  MQTT conectado a mqtts://...
# 🛰  MQTT suscrito a nikolator/+/+/reading
```

Si MQTT no conecta, revisar credenciales y URL en Render env vars.

### 9. Seed superadmin (2 min)
Render → `nikolator-backend` → **Shell**:
```bash
npm run seed:superadmin
```
Cambiar password del admin desde el frontend inmediatamente.

### 10. Smoke test del flujo completo (10 min)
1. Login → registrar nuevo usuario+org
2. Crear motor
3. **Integraciones** → crear API key → guardar plaintext
4. Motor detail → "Conectar sensor" → provider `webhook`, externalId `test-001`
5. Otro tab/máquina: ejecutar curl del ejemplo en /integraciones con la key real
6. Dashboard original: verificar que el live indicator del TopBar pulsa cyan al recibir el evento, y los KPIs/sparklines se actualizan sin recargar
7. Crear sensor con provider `mqtt-generic`, externalId `mqtt-001`
8. Publicar via mosquitto al topic mostrado en /integraciones — verificar idem en dashboard

### 11. Custom domain (opcional, 10 min)
- Comprar `nikolator.com` (Cloudflare, Porkbun, NameCheap)
- Render → Settings → Custom Domains → `app.nikolator.com` (frontend) y `api.nikolator.com` (backend)
- Apuntar CNAMEs en DNS → SSL automático
- Actualizar `CORS_ORIGIN` y `NEXT_PUBLIC_API_URL` (frontend rebuild)

## Riesgos a tener en mente

- **Single-instance SSE**: si Render escala el backend a múltiples replicas, los eventos solo llegan a los clientes conectados a la misma instance que recibió el ingest. Para multi-instance necesitamos Redis pub/sub. Para los primeros 50-100 clientes, single instance es suficiente.

- **MQTT en Render Starter**: la conexión persistente está limitada por el tier. En Starter aguanta sin problemas. En despliegues, la conexión se reinicia (~30s downtime); HiveMQ con QoS 1 retiene mensajes para redelivery, así que no se pierden datos.

- **Token expiry en SSE**: el JWT del usuario tiene TTL 15 min. Si la conexión SSE sigue abierta cuando el token expira, sigue funcionando (validación es solo al conectar). Si se desconecta y reconecta con token expirado, falla — el usuario tiene que recargar la página. Aceptable para v1; si molesta, agregar lógica de refresh-on-error.

- **Mock data por browser** (centros, switchovers, repair-centro mappings): siguen en localStorage. Para demos a clientes, abrí desde tu browser. Migración a backend cuando firmen.

- **Sentry**: env var existe pero no SDK. Conectar cuando tengas tráfico real (~15 min).

- **Backups de Mongo**: M0 no tiene backups automáticos. Antes del primer cliente real, **upgrade a M2** ($9/mes) o configurar mongodump diario.

## Costo mensual proyectado para los primeros 30 días

| Servicio | Plan | Costo |
|---|---|---|
| Render backend | Starter | $7 |
| Render frontend | Starter o Free | $0–7 |
| MongoDB Atlas | M0 (free) | $0 |
| HiveMQ Cloud | Free tier | $0 |
| Domain (opcional) | nikolator.com | $1/mes (anual) |
| **Total** | | **$8–15/mes** |

## Tiempo total estimado
**60–90 min** desde el push hasta URL pública con MQTT + SSE funcionando end-to-end.

## Lo que NO está en este plan (para después)

- Sentry / error tracking
- Multi-region deployment
- Custom domain
- Mongo backups (M2)
- Multi-instance SSE con Redis
- Per-org auth en MQTT broker (ACLs)
- Auto-creación de sensores via MQTT
- WebSocket bidireccional (para comandos al equipo, no solo telemetría)

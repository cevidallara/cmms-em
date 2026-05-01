# Plan — Integración de sensores (Fase 9 / "Sensors MVP")

**Estado:** planificado, sin arrancar. Comienza después de validar el deploy de v1.

## Goal
Vender Nikolator como la única plataforma agnóstica al hardware: cualquier sensor (Dynamox, Tractian, WEG, genéricos chinos, MQTT, manual) empuja datos a un mismo endpoint canónico, y se ven en tiempo real.

## Decisiones cerradas

- **MQTT incluido en MVP** — el diferenciador "soportamos sensores genéricos" exige soporte directo desde día uno.
- **Adapter de referencia: solo Webhook genérico** — máxima fuerza de demo ("un curl funciona con lo que sea") sin acoplarse a un proveedor.
- **API keys per-organización con múltiples keys permitidas** — cada integración puede tener su propia key con scope; rotación sin downtime.
- **Real-time visible en dashboard** — SSE (server-sent events) push del backend al frontend; al ingerirse una lectura, el dashboard se actualiza sin recargar.

## Cambios al modelo (backend)

### Nuevos

```js
ApiKey {
  _id, organizacionId, nombre, prefix ("nik_live_..."),
  hashSha256, scopes ["ingest:write", "read"],
  lastUsedAt, revokedAt, createdAt
}

Sensor {
  _id, organizacionId, assetId,
  provider ("dynamox" | "tractian" | "weg" | "mqtt-generic" | "webhook" | "manual"),
  externalId, type ("vibration" | "energy" | "temperature" | ...),
  config (free JSON: topic, units, calibration),
  lastSeenAt, lastValue, status,
  createdAt
}
```

### Extender

```js
Reading {
  ...campos actuales,
  sensorId?: ObjectId(Sensor),
  source: "manual" | "sensor" | "scada" | "import" | "mqtt"
}
```

## API contract

### Endpoint canónico

```
POST /api/ingest
Authorization: Bearer nik_live_xxxxx

{
  "externalId": "DYN-1234",
  "provider": "dynamox",
  "fecha": "2026-05-01T17:30:00Z",
  "consumoEnergia": 124.8,
  "voltaje": 380,
  "corriente": 18.4
}
```

Auto-resolución: si `externalId+provider` no matchea un Sensor, devuelve 404 con instrucción de registrar el sensor primero. Soporta ingesta batch (array de payloads).

### MQTT topics

```
nikolator/<orgId>/<sensorExternalId>/reading
```

Auth: credenciales por organización en el broker (un user/pass por org).

### SSE endpoint

```
GET /api/events
Authorization: Bearer <jwt>
Accept: text/event-stream
```

Emite eventos `reading.created` con payload del Reading. Filtrado server-side por `organizacionId` del JWT.

## Backend stack adicional

- `mqtt` package (cliente MQTT subscriptor)
- Broker: HiveMQ Cloud free tier (2 MB/s, 100 conns) para MVP; migrar a EMQX self-hosted cuando escale
- SSE nativo de Node (sin librerías) sobre HTTP

## Frontend

- Tab "Sensores" en motor detail: tabla con provider, externalId, lastSeen, status, switch enable/disable
- Página `/integraciones`:
  - Sección "API keys": CRUD con nombre + scopes; muestra key una sola vez al crear
  - Sección "Webhook": curl example pre-llenado con URL real + ejemplo de payload
  - Sección "MQTT": URL del broker + credenciales + topic pattern + cliente recomendado (mosquitto)
  - Sección "Conectores": cards con estado (✅ activo / 🟡 beta / 🔘 próximamente) por proveedor
- Hook `useLiveReadings()` que abre EventSource y dispara invalidaciones de TanStack Query → dashboard se actualiza solo cuando llega una lectura nueva
- En motor detail: "live indicator" pulsante cuando llega data nueva

## Phasing dentro del MVP

### Semana 9 — Backend core (≈5 días)
- Modelos `Sensor`, `ApiKey`
- Extender `Reading` con `sensorId` + `source`
- Endpoint `POST /api/ingest` con auth por API key
- CRUD de API keys (`POST/GET/DELETE /api/apikeys`)
- Tab "Sensores" en motor detail (read-only consume)
- Doc del Webhook genérico (markdown en `/integraciones`)

### Semana 10 — MQTT integration (≈5 días)
- Cliente MQTT en backend (suscripción a topics `nikolator/+/+/reading`)
- Provisioning de credenciales MQTT por org (un user/pass)
- Translation MQTT message → `/api/ingest` internamente
- `/integraciones`: sección MQTT con URL + creds + topic ejemplo

### Semana 11 — Real-time dashboard (≈5 días)
- SSE endpoint `/api/events` con filtro por org
- Hook frontend `useLiveReadings` con EventSource
- Auto-invalidación de queries de readings/motors
- Live indicator pulsante en dashboard cards y motor detail

## Riesgos y consideraciones

- **Spin-down de Render free tier mata SSE**: una conexión SSE inactiva se desconecta tras spin-down. Para demo, plan Starter ($7/mes). Para prod, mover a algo con keep-alive estable.
- **MQTT en HiveMQ Cloud free tier**: 100 conexiones simultáneas — suficiente para 100 sensores. Más allá, plan pago o EMQX self-hosted.
- **Auth de broker MQTT**: usuarios/passwords por org; HiveMQ tiene API para provisionar. EMQX similar. Decisión de qué usar va en semana 10.
- **Backpressure en ingest**: si llegan 1000 lecturas/seg sin queue, Mongo se ahoga. Para MVP limitar a 10 req/seg por API key. Si necesitamos más, agregar Redis Streams o BullMQ en fase posterior.
- **SSE scalability con múltiples instancias backend**: cada SSE está atada a la instancia que la creó. Si Render escala a varias instancias, hay que coordinar via Redis pub/sub. Para MVP single-instance, OK.
- **Privacidad y aislamiento**: cada Reading tiene `organizacionId`; tenant scope ya cubre esto. Asegurar que el broker MQTT también filtra por org en authz (no podés leer topics de otra org).

## Marketing / sales

- Sección nueva en landing: "Conectá cualquier sensor — Dynamox, Tractian, WEG, genéricos chinos. Una sola vista."
- Copy: "No competís con tu sensor, sos cliente del sensor." (adaptar a tuteo chileno: "No compites con tu sensor, eres cliente del sensor.")
- Comparativa visual: dashboard de Tractian + dashboard de Dynamox vs Nikolator (un solo dashboard).

## Tiempo total estimado
**3 semanas** desde arranque hasta demo-able con MQTT + real-time funcionando.

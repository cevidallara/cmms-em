# Plan — Vertical IA de Nikolator

**Estado:** propuesta inicial, post Sensors MVP (W11) y previo a go-live.
**Fuente de inspiración:** [YC RFS Summer 2026](https://www.ycombinator.com/rfs).

## Por qué ahora

El MVP de Nikolator (W1–W11) ya tiene el sustrato de datos que un SaaS IA-base necesita:

- **Inventario estructurado** de motores con specs.
- **Telemetría en tiempo real** vía MQTT + SSE.
- **Historial transaccional**: reparaciones (Kanban), backups, switchovers, lecturas, costo/beneficio.
- **Multi-tenancy** con API keys por org.

Sin esa base, "agregar IA" es decoración. Con esa base, la IA opera sobre datos reales por cliente y se vuelve el producto.

## Moat: Centro de Servicios + Datos Históricos

El fundador es co-dueño de un centro de servicios industrial con un CMMS interno (AppSheet) en producción operativa. Ese centro genera, **hoy**, los datos que cualquier competidor tardaría años en acumular:

| Asset | Qué provee a Nikolator | Por qué es irreproducible |
|---|---|---|
| **Service records con foto** | Motores reales que fallaron + diagnóstico + reparación + horas + costo final | Requiere operación física, no se compra |
| **Cotizaciones históricas de compra** | Precios reales de motor nuevo, por distribuidor, en el tiempo, en CLP | No existe en ningún catálogo público de Chile |
| **Cross-reference de repuestos** | Bobinados, rodamientos, mecanizados por modelo de motor | Conocimiento tácito convertido en estructura |
| **Directorio de distribuidores con historial** | Tiempo de respuesta real, % cierre, condiciones | Cold-start del Sourcing Agent resuelto |
| **Fotos de placa de motores** | Training set futuro para visión (onboarding instantáneo) | Decenas de miles de imágenes ya etiquetadas por contexto |

**Mapea directo al RFS de YC "AI-Native Discovery Engines":** el feedback loop *(síntoma → causa raíz → acción → resultado)* ya está cerrado en el mundo físico todos los días en el centro. Convertir eso en dataset es lo que hace al agente de mantenimiento credible.

### Reglas de acoplamiento

El centro de servicios y Nikolator son **productos independientes que comparten datos**, no un código fusionado:

1. La migración AppSheet → SaaS interno sigue su camino. **No es precondición de nada en Nikolator.**
2. Nikolator extrae datos de AppSheet vía export (CSV / Sheets API), no vía integración profunda.
3. La interfaz entre ambos es un contrato de datos versionado.
4. Si una de las dos cosas se atrasa o pivota, la otra sigue.

### Centro como supplier #1, no como preferencia hardcodeada

Decisión de diseño tomada ahora porque retrofittear esto es caro:

> **Nikolator es supplier-agnostic desde el día uno.** El centro de servicios de la familia es el primer proveedor del directorio, pero compite por mérito (precio, lead time, calidad histórica trackeada), no por flag.

Implicaciones:
- El algoritmo de matching no toma flags de "preferred supplier"; usa scoring sobre datos.
- El UI muestra top-3 con razón visible al cliente.
- En 12 meses, si entran competidores legítimos al directorio, la plataforma sigue creíble.
- Ventaja go-to-market legítima: el centro familiar es **garantía de servicio del MVP** ("si nadie cotiza, lo cotizamos nosotros"), no excepción algorítmica.

## Lectura del YC RFS aplicada a Nikolator

Cinco RFS de YC le pegan directo:

1. **SaaS Challengers** — YC explicita *"industrial control systems"* como target de reemplazo AI-native. Nikolator es exactamente eso para mantenimiento de motores.
2. **AI-Native Service Companies** — el TAM de servicio (cuadrillas eléctricas, centros de rebobinado, peritos energéticos) es órdenes de magnitud mayor que el de software. La capa de coordinación con centros de servicio absorbe parte de ese TAM.
3. **The AI Operating System for Companies** — hacer la flota "queryable" en lenguaje natural por el jefe de planta.
4. **AI-Native Discovery Engines** — el loop *propose → act → measure → learn* aplicado a optimización energética (ej: rebalanceo de carga, swap a motor backup) con telemetría como feedback.
5. **Software for Agents** — exponer Nikolator vía MCP para que el agente del cliente consulte la flota desde fuera de la app.

## Tesis del producto

> **Nikolator AI = el ingeniero de eficiencia que cuida tu flota 24/7.**

No es un dashboard con un chatbot pegado. Es un agente que detecta, explica, recomienda y (con aprobación) ejecuta acciones sobre la flota de motores.

### Tres capas de valor

| Capa | Qué hace | Buyer principal |
|---|---|---|
| **1. Conversacional** | Chat sobre la flota, alertas explicadas, advisor de costo/beneficio | Jefe de planta, gerente de mantenimiento |
| **2. Background agents** | Auditoría semanal, anomaly detection, onboarding por upload | Gerente de operaciones, CFO |
| **3. External Ops** | Sourcing Agent (compras de motores), Repair Coordinator (reparaciones), MCP | Director industrial, dueño, área de compras |
| **4. Autónomos / Closed-loop** | Optimización de carga con feedback de telemetría | Director industrial, dueño |

## Roadmap por sprints (W12 → W20)

### W11.5 — Data Extraction Sprint (paralelo a W12, no bloquea)

Sprint independiente que corre simultáneo a W12. 1 dev focalizado, 1-2 semanas.

**Objetivo:** convertir los datos vivos del centro de servicios + cotizaciones históricas en seed data versionada para Nikolator.

**Outputs:**
- `repair_history.csv` — motor model, falla, repuestos, horas, costo final, fecha (de service records AppSheet).
- `historical_quotes.csv` — distribuidor, modelo motor, precio CLP, lead time, condición de pago, fecha (de cotizaciones de compra).
- `motor_parts.csv` — cross-reference repuestos ↔ modelos de motor (bobinados, rodamientos, mecanizados).
- `providers_seed.csv` — directorio de distribuidores con response time real, % cierre, contacto preferido.
- `motor_photos/` — fotos de placas con metadata (model, brand, parsed specs si disponible) en S3 / storage. Indexadas, no procesadas todavía.

**Cómo:**
- Script de ingesta que toma exports de AppSheet (CSV/Sheets API).
- Normalización a schemas comunes con Nikolator.
- Versionado de datasets (DVC o solo carpeta versionada por timestamp).
- HITL para casos ambiguos en parseo de cotizaciones libres.

**No-goals:**
- No fusionar código con el SaaS interno del centro.
- No esperar a que la migración AppSheet → SaaS interno termine.
- No exponer estos datos en UI todavía; solo poblar tablas backend para que W17b/W18 los consuma.

### W12 — IA Foundation (1 semana)
- Anthropic SDK integrado en backend (Node).
- Prompt caching agresivo: motor specs + telemetría reciente como prefix cacheado.
- Endpoint `/api/ai` con streaming SSE (reusa infra de W10/W11).
- Telemetría de uso/costo por org → tabla `ai_usage` para facturación futura.
- Modelos: **Sonnet 4.6** para razonamiento profundo, **Haiku 4.5** para chat frecuente/cheap.
- Env vars: `ANTHROPIC_API_KEY`, `AI_DEFAULT_MODEL`, `AI_BUDGET_PER_ORG_USD`.

### W13 — Conversational Query (1 semana)
- Sidebar de chat dentro de la app (Next.js).
- Tools nativos: `getMotors`, `getReadings(motorId, range)`, `getRepairs(motorId)`, `getCostBenefit(filter)`, `getBackupStatus(motorId)`.
- System prompt en español neutro/Chile, con conocimiento del modelo de datos.
- Streaming token-a-token vía SSE.
- **Este es el wow para demos.** Prioridad alta: el lead pendiente lo entiende en 30s.

### W14 — Advisor de Costo/Beneficio con IA (1 semana)
- En el comparador masivo existente, columna *"Recomendación IA"*.
- Modal *"Análisis profundo"* por motor: explica decisión (reparar vs reemplazar vs swap a backup) con números, supuestos y riesgo.
- Output estructurado (JSON) cacheable y revisable.

### W15 — Anomaly Detection MVP (1 semana)
- Stats clásicos: z-score sobre baseline rodante 30d + EWMA por motor.
- LLM **solo** para narrar la anomalía y sugerir acción ("la corriente subió 18% en 4 días sin que aumentara la carga; sugiere fricción mecánica").
- Notificación en TopBar live (la infra SSE ya está).
- Tabla `anomalies` con estado (open/acked/resolved/false-positive) → feedback loop para tunear.

### W16 — Onboarding Agent (1 semana)
- Upload de Excel/CSV/PDF/foto de la placa del motor → agente extrae specs, normaliza unidades, crea entries.
- Reduce **time-to-value** del onboarding de horas a minutos.
- Killer feature para cerrar pilotos: el cliente sube su Excel histórico y al rato ya está viendo su flota.

### W17 — Energy Audit Agent (background, 1–2 semanas)
- Cron semanal por org.
- Audita la flota completa: motores ineficientes, sobre-dimensionados, con factor de carga malo, viejos.
- Genera **Informe Ejecutivo de Eficiencia** (PDF + email).
- Este informe es la entregable que justifica el ticket mensual frente al CFO.

### W17b — Catálogo de Motores (precondición de Sourcing, 1 semana)

**Fuente primaria:** seed data de W11.5 (motores que el centro ya conoce + precios reales históricos).
**Fuente secundaria:** datasheets PDF de WEG / ABB / Siemens / Marelli / Toshiba para cubrir modelos no servidos antes.

- Tabla `motor_catalog` con índices por specs (potencia, voltaje, polos, frame IEC/NEMA, eficiencia, IP).
- Tabla `motor_pricing_history` alimentada con `historical_quotes.csv` → precio de mercado real por modelo + distribuidor + fecha (asset diferencial).
- Pipeline de ingesta de PDFs solo para gaps del seed.
- Fuzzy matching motor-cliente → top-N equivalentes con score de compatibilidad.
- LLM solo se usa para parsear PDFs ambiguos y narrar el match al usuario.

Que la fuente primaria sean datos reales, no PDFs, cambia la calidad del catálogo de "genérico" a "ground truth chileno". Ese es el moat operativizado.

### W18 — Sourcing Agent + Repair Coordinator (External Ops Layer, 2–3 semanas)

Fusiona dos agentes que comparten infraestructura (directorio de proveedores, outbound multicanal, parser de replies, HITL queue) y que mapean al RFS *"AI-Native Service Companies"*.

**Infra compartida:**
- Tabla `providers` (distribuidores de motores + centros de servicio) **pre-poblada en W11.5 con el directorio del centro de servicios** + historial real de respuesta y cierre. Cold-start resuelto.
- Outbound queue (BullMQ): genera mensaje a partir de template + spec + LLM, envía, registra.
- Inbox parser: webhook de WhatsApp + IMAP polling de email → LLM extrae estructura → guarda en `quotes` o `repair_quotes`.
- HITL queue: si el parser tiene baja confianza (<0.85), entra a revisión humana antes de mostrar.
- **Scoring supplier-agnostic:** ranking por (precio + lead time + rating histórico + condiciones), sin flag de "preferred". El centro familiar es supplier #1 por mérito, no por hardcode.

**Sourcing Agent — flujo:**
1. Trigger desde `/comparador` o `/motor/:id` → botón *"Cotizar reemplazo"*.
2. Match en catálogo → top-3 modelos equivalentes.
3. Selecciona 3 distribuidores curados según historial.
4. Outbound automático con la spec normalizada.
5. UI muestra estado *"Esperando cotizaciones (2-24h)"*.
6. Cuando llegan replies → parser → normaliza → compara → notifica al cliente vía WhatsApp.
7. Cliente acepta → orden de compra generada en Nikolator → tracking de entrega.

**Repair Coordinator — flujo análogo:**
- Cuando un motor entra a "Diagnóstico" en el Kanban → outbound a centros de servicio cotizando reparación → comparador → orden de trabajo → seguimiento de SLA.

**Modelo de negocio:**
- **Transactional fee** sobre compras/reparaciones cerradas vía la plataforma (3-5% de la transacción), además del SaaS.
- En el primer año: tarifa fija por cotización entregada ($X CLP/cotización lista) si el take-rate genera fricción comercial inicial.

**Moat acumulativo:** cada cotización que llega enriquece `motor_catalog` con precio de mercado real (modelo + distribuidor + fecha). En 12 meses, dataset de pricing irreproducible por la competencia.

### W19 — MCP Server (1 semana)
- Expone tools de Nikolator vía Model Context Protocol.
- *"Conectá tu flota a Claude"* — el cliente desde su Claude Desktop pregunta por su flota.
- Diferenciador con prensa propia, atrae early adopters tech-savvy.

### W20 — Cross-fleet Benchmarking (cuando N ≥ 10 clientes)
- Anonimizado, agregado: *"tu motor M-210 consume 12% más que el promedio de motores 50HP en flotas similares"*.
- Efecto red sobre los datos: cada cliente nuevo mejora el producto para todos.

## Decisiones de arquitectura

| Tema | Decisión | Motivo |
|---|---|---|
| **Proveedor LLM** | Anthropic Claude vía SDK directo | El usuario ya está en este ecosistema; Sonnet/Haiku cubren razonamiento + cost-sensitive |
| **Prompt caching** | Obligatorio desde W12 | Specs de motores + telemetría como prefix cacheado → cost ↓ 5-10× |
| **Vector store** | MongoDB Atlas Vector Search | Cero deps nuevas (ya en Atlas) |
| **Tool-use framework** | Anthropic SDK nativo | Suficiente hasta ~8 tools; reevaluar Claude Agent SDK después |
| **Anomaly detection** | Stats clásicos primero, LLM para explicar | LLM no es para detectar señales numéricas; es caro y peor que un z-score |
| **Streaming** | SSE existente (W11) | Reuso infra |
| **Job runner** | BullMQ + Redis (managed Render) | Para audit agent y repair coordinator |
| **Budget cap** | Por org, env var + middleware | Evita runaway cost por agente loopeando |
| **Modelo dual** | Haiku para chat freq, Sonnet para deep dive | Cost por token y por response |

## Implicancia en pricing

| Tier | Incluye | Precio orientativo |
|---|---|---|
| **Base** | CMMS + sensores + dashboard live (W1–W11) | $X/mes (anchor barato) |
| **AI** | Chat, alertas inteligentes, audit semanal, advisor | **$Y ≈ 2–3× Base** |
| **Pro / Enterprise** | External Ops (sourcing + repair), MCP, benchmarking cross-fleet, SLA | $Z, contrato anual |

**Layer transaccional (encima del SaaS):**
- Sourcing Agent: 3-5% take-rate sobre motores comprados vía la plataforma, o tarifa fija por cotización lista.
- Repair Coordinator: take-rate análogo sobre reparaciones coordinadas.

La capa AI es donde está el margen recurrente. El layer transaccional es donde se multiplica el ingreso por cuenta. El tier Base solo es bait para conseguir los datos sobre los que después la IA opera.

## Demo narrativa post-W14

Lo que va a ver el lead pendiente en una demo de 5 minutos:

1. Login → dashboard real-time con motores y sus consumos.
2. Chat: *"mostrame los motores que más consumieron esta semana"* → tabla + sparklines en respuesta.
3. Click en Motor M-210 → *"consume 14% más que motores similares en tu flota; la eficiencia bajó 8% en 30 días. Recomiendo: ① calibración de carga ② chequeo de rodamientos. Costo estimado intervención $800, ahorro anual proyectado $2.400."*
4. TopBar pulsea: *"M-307 — firma anómala detectada"* → modal IA explica el patrón y la acción sugerida.
5. *"Generá el informe ejecutivo de eficiencia de mayo"* → PDF descargable, listo para mandar al CFO del cliente.

Ese flujo cierra pilotos.

## Riesgos y mitigación

- **Costo LLM se va de mano** → prompt caching, Haiku por default, cap por org desde W12.
- **Alucinaciones sobre datos del cliente** → tools nativos, no RAG libre. El modelo solo ve lo que le pasa el tool. Si no hay tool, no inventa.
- **Cliente no confía en recomendaciones automáticas** → todo el output muestra: qué datos vio, qué supuso, nivel de confianza. El cliente aprueba antes de ejecutar.
- **Latencia de chat con tools** → streaming SSE + Haiku para queries simples → bajo 2s p50.
- **Compliance de datos sensibles** → opt-in explícito para benchmarking cross-fleet (W20). Anonimización agresiva.
- **Sourcing — distribuidores rechazan outbound automatizado** → agente firma desde dominio Nikolator, identifica al cliente por nombre, ofrece valor (volumen agregado, pricing transparente). Onboarding curado de proveedores antes de masificar.
- **Sourcing — parser de replies falla en PDFs/free-form** → HITL queue obligatoria los primeros 6 meses; uso del % de revisión humana como métrica de mejora del parser.
- **Sourcing — conflicto comercial con distribuidores existentes del cliente** → permitir al cliente cargar sus distribuidores preferidos al directorio; Nikolator agrega cobertura, no la sustituye.
- **Catálogo — datasheets desactualizados** → re-ingest trimestral + flag de versión por modelo; cotizaciones reales del Sourcing Agent confirman/refutan specs.

## Lo que NO está en este plan

- Visión computacional sobre cámaras de planta (otra vertical, otro presupuesto).
- Voice agents (puede venir después con Realtime API).
- Marketplace de centros de servicio externos como producto separado.
- Hardware propio (sensores Nikolator-branded).

## Decisión pendiente

**¿Go-live primero o W12–W14 antes del go-live?**

Recomendación: **go-live primero** (la infra MQTT/SSE ya está, el cliente que lo vea sin AI igual entiende), W12 arranca apenas tengas la URL pública. Esto evita acoplar dos riesgos (deploy + AI nuevo) en la misma ventana.

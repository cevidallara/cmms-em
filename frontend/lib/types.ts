export type EstadoActual =
  | "Operativo"
  | "En reparación"
  | "Fuera de servicio"
  | "Standby";

export type EstadoBackup = "Disponible" | "Reservado" | "En Uso";

export type ClaseIE = "IE1" | "IE2" | "IE3" | "IE4";

export type Asset = {
  _id: string;
  nombre: string;
  tipo: string;
  modelo?: string;
  ubicacion?: string;
  estado?: string;
  cliente: string;
  sector?: string;
  categoria?: string;
  subcategoria?: string;
  potenciaKW?: number;
  numeroSerie?: string;
  marca?: string;
  estadoActual?: EstadoActual | string;
  esBackup?: boolean;
  estadoBackup?: EstadoBackup;
  activoRelacionado?: string | Asset | null;
  proveedor?: string;
  fechaAdquisicion?: string;
  costo?: number;
  organizacionId: string;
  creadoPor?: string;
  createdAt?: string;
};

export type AssetInput = Omit<
  Asset,
  "_id" | "organizacionId" | "creadoPor" | "createdAt"
>;

export type Reading = {
  _id: string;
  assetId: string | Asset;
  consumoEnergia?: number;
  fecha: string;
  voltaje?: number;
  corriente?: number;
  horasOperacion?: number;
  costoEnergia?: number;
  moneda?: "CLP" | "USD";
  factorCarga?: number;
  factorPotencia?: number;
  eficienciaEstimada?: number;
  consumoAnualKWh?: number;
  costoAnual?: number;
  claseIEActual?: ClaseIE;
  observaciones?: string;
};

export const TIPOS_MOTOR = [
  "Motor eléctrico",
  "Bomba",
  "Compresor",
  "Ventilador",
  "Otro",
] as const;

export const ESTADOS_ACTUAL: EstadoActual[] = [
  "Operativo",
  "En reparación",
  "Fuera de servicio",
  "Standby",
];

export const ESTADOS_BACKUP: EstadoBackup[] = [
  "Disponible",
  "Reservado",
  "En Uso",
];

export type Prioridad = "Baja" | "Mediana" | "Alta" | "Emergencia";
export type Progreso = "Ingresado" | "En Taller" | "Para despachar" | "Despachado";

export const PRIORIDADES: Prioridad[] = ["Baja", "Mediana", "Alta", "Emergencia"];
export const PROGRESOS: Progreso[] = ["Ingresado", "En Taller", "Para despachar", "Despachado"];

export type Repair = {
  _id: string;
  assetId: string | Asset;
  tecnico: string;
  estado?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  otCliente?: string;
  nrcv?: string;
  prioridad?: Prioridad;
  categoria?: string;
  subcategoria?: string;
  responsable?: string;
  mandante?: string;
  sector?: string;
  progreso?: Progreso;
  guiaCliente?: string;
  fechaDespacho?: string;
  centroServicioId?: string | { _id: string; nombre: string } | null;
  asignadoA?: string | { _id: string; nombre: string; email: string } | null;
  organizacionId?: string;
  creadoPor?: string;
};

export type RepairInput = {
  assetId: string;
  tecnico: string;
  descripcion?: string;
  prioridad?: Prioridad;
  progreso?: Progreso;
  categoria?: string;
  subcategoria?: string;
  responsable?: string;
  sector?: string;
  otCliente?: string;
  nrcv?: string;
  estado?: string;
  fechaDespacho?: string;
};

export type SensorProvider =
  | "webhook"
  | "dynamox"
  | "tractian"
  | "weg"
  | "mqtt-generic"
  | "manual"
  | "otro";

export type SensorType = "energy" | "vibration" | "temperature" | "rotation" | "general";

export type SensorStatus = "online" | "offline" | "error" | "unknown";

export type Sensor = {
  _id: string;
  organizacionId: string;
  assetId: string | { _id: string; nombre: string; tipo: string; cliente?: string; sector?: string };
  provider: SensorProvider;
  externalId: string;
  type: SensorType;
  config?: Record<string, unknown>;
  lastSeenAt?: string;
  lastValue?: Record<string, unknown>;
  status: SensorStatus;
  createdAt?: string;
};

export type SensorInput = {
  assetId: string;
  provider: SensorProvider;
  externalId: string;
  type?: SensorType;
  config?: Record<string, unknown>;
};

export const SENSOR_PROVIDERS: { value: SensorProvider; label: string; status: "active" | "beta" | "soon" }[] = [
  { value: "webhook", label: "Webhook genérico", status: "active" },
  { value: "mqtt-generic", label: "MQTT genérico", status: "active" },
  { value: "dynamox", label: "Dynamox", status: "soon" },
  { value: "tractian", label: "Tractian", status: "soon" },
  { value: "weg", label: "WEG", status: "soon" },
  { value: "manual", label: "Manual", status: "active" },
  { value: "otro", label: "Otro", status: "active" },
];

export const SENSOR_TYPES: { value: SensorType; label: string }[] = [
  { value: "energy", label: "Energía / consumo" },
  { value: "vibration", label: "Vibración" },
  { value: "temperature", label: "Temperatura" },
  { value: "rotation", label: "Rotación / RPM" },
  { value: "general", label: "General" },
];

export type ApiKeyScope = "ingest:write" | "read";

export type ApiKey = {
  _id: string;
  nombre: string;
  prefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt?: string;
  revokedAt?: string | null;
  createdAt: string;
};

// Devuelto solo al crear (incluye plaintext una sola vez)
export type ApiKeyCreated = ApiKey & { key: string };

export type ApiKeyInput = {
  nombre: string;
  scopes?: ApiKeyScope[];
};

export type CentroServicio = {
  id: string;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  ubicacion?: string;
  especialidad?: string;
  rating?: number;
  reparacionesCompletadas?: number;
  notas?: string;
  createdAt: string;
};

export type CentroServicioInput = Omit<CentroServicio, "id" | "createdAt">;

export type SwitchoverEntry = {
  id: string;
  fecha: string;
  primaryId: string;
  backupId: string;
  motivo: "Mantenimiento programado" | "Falla del primario" | "Prueba" | "Otro";
  duracionMin?: number;
  notas?: string;
};

export type AnomalyMetric =
  | "consumoEnergia"
  | "voltaje"
  | "corriente"
  | "factorCarga"
  | "eficienciaEstimada";

export type AnomalySeverity = "low" | "medium" | "high";
export type AnomalyStatus = "open" | "acked" | "resolved" | "false_positive";
export type AnomalyDirection = "high" | "low";
export type NarrationStatus = "pending" | "done" | "failed";

export type Anomaly = {
  _id: string;
  motorId:
    | string
    | { _id: string; nombre: string; tipo?: string; marca?: string; modelo?: string; potenciaKW?: number };
  organizacionId: string;
  readingId?: string;
  metric: AnomalyMetric;
  observedValue: number;
  baselineMedian?: number;
  baselineMad?: number;
  baselineP10?: number;
  baselineP90?: number;
  baselineCount?: number;
  zScore: number;
  direction: AnomalyDirection;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  narration?: string;
  suggestedAction?: string;
  narrationStatus: NarrationStatus;
  detectedAt: string;
  ackedAt?: string;
  resolvedAt?: string;
  ackedBy?: string;
};

export type AnomalyCounts = {
  open: number;
  acked: number;
  resolved: number;
  false_positive: number;
  bySeverity: { low: number; medium: number; high: number };
};

export type AdviceRecommendation =
  | "mantener"
  | "reparar"
  | "reemplazar"
  | "swap_a_backup"
  | "datos_insuficientes";

export type AdviceRiskLevel = "bajo" | "medio" | "alto";

export type MotorAdvice = {
  _id: string;
  motorId: string;
  organizacionId: string;
  contentVersion: string;
  recommendation: AdviceRecommendation;
  recommendationLabel?: string;
  reasoning: string;
  savingsEstimateUsd: number;
  paybackMonths?: number;
  riskLevel: AdviceRiskLevel;
  confidence: number;
  supuestos: string[];
  proximosPasos: string[];
  modeloUsado?: string;
  computedAt: string;
};

export type ReadingInput = {
  assetId: string;
  consumoEnergia?: number;
  fecha?: string;
  voltaje?: number;
  corriente?: number;
  horasOperacion?: number;
  costoEnergia?: number;
  moneda?: "CLP" | "USD";
  factorCarga?: number;
  factorPotencia?: number;
  eficienciaEstimada?: number;
  claseIEActual?: ClaseIE;
  observaciones?: string;
};

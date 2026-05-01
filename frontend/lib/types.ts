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

export type SwitchoverEntry = {
  id: string;
  fecha: string;
  primaryId: string;
  backupId: string;
  motivo: "Mantenimiento programado" | "Falla del primario" | "Prueba" | "Otro";
  duracionMin?: number;
  notas?: string;
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

/**
 * Calcula la eficiencia estimada de un motor eléctrico.
 * Eficiencia = (Potencia mecánica de salida / Potencia eléctrica de entrada) × 100
 *
 * Potencia entrada (kW) = (V × I × √3 × FP) / 1000  (motor trifásico)
 * Potencia salida (kW) = Potencia nominal × (Factor de carga / 100)
 */
export function calculateEfficiency(voltaje, corriente, potenciaKW, factorPotencia = 0.85, factorCarga = 75) {
  if (voltaje == null || voltaje <= 0) return null;
  if (corriente == null || corriente <= 0) return null;
  if (potenciaKW == null || potenciaKW <= 0) return null;

  const potenciaEntrada = (voltaje * corriente * Math.sqrt(3) * factorPotencia) / 1000;
  const potenciaSalida = potenciaKW * (factorCarga / 100);

  if (potenciaEntrada <= 0) return null;

  const eficiencia = (potenciaSalida / potenciaEntrada) * 100;
  return Math.min(Math.round(eficiencia * 100) / 100, 100);
}

/**
 * Calcula el consumo anual de energía en kWh.
 * Consumo = (Potencia × Factor de carga / Eficiencia) × Horas de operación
 */
export function calculateAnnualConsumption(potenciaKW, horasOperacion, factorCarga = 75, eficiencia) {
  if (potenciaKW == null || potenciaKW <= 0) return null;
  if (horasOperacion == null || horasOperacion <= 0) return null;
  if (eficiencia == null || eficiencia <= 0) return null;

  const consumo = (potenciaKW * (factorCarga / 100) / (eficiencia / 100)) * horasOperacion;
  return Math.round(consumo * 100) / 100;
}

/**
 * Calcula el costo anual de energía.
 * Costo = Consumo anual (kWh) × Precio por kWh
 */
export function calculateAnnualCost(consumoKWh, costoEnergia) {
  if (consumoKWh == null || consumoKWh <= 0) return null;
  if (costoEnergia == null || costoEnergia <= 0) return null;

  return Math.round(consumoKWh * costoEnergia * 100) / 100;
}

/**
 * Compara dos escenarios de eficiencia y calcula ahorros.
 * Útil para evaluar reemplazo de motor IE1 → IE3/IE4.
 *
 * @returns {{ ahorroKWh: number, ahorroCosto: number, ahorroPorcentaje: number }}
 */
export function calculateComparison(eficienciaActual, eficienciaNueva, consumoActual, costoEnergia) {
  if (eficienciaActual == null || eficienciaActual <= 0) return null;
  if (eficienciaNueva == null || eficienciaNueva <= 0) return null;
  if (consumoActual == null || consumoActual <= 0) return null;
  if (costoEnergia == null || costoEnergia <= 0) return null;

  const consumoNuevo = consumoActual * (eficienciaActual / eficienciaNueva);
  const ahorroKWh = Math.round((consumoActual - consumoNuevo) * 100) / 100;
  const ahorroCosto = Math.round(ahorroKWh * costoEnergia * 100) / 100;
  const ahorroPorcentaje = Math.round(((consumoActual - consumoNuevo) / consumoActual) * 10000) / 100;

  return {
    ahorroKWh,
    ahorroCosto,
    ahorroPorcentaje
  };
}

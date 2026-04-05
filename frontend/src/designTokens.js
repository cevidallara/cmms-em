/**
 * Design Tokens — CMMS-EM
 *
 * Fuente única de verdad para tamaños, colores y espaciado del sistema.
 * Importar desde aquí en vez de usar valores hardcodeados en componentes.
 */

// ─── Paleta ──────────────────────────────────────────────
export const colors = {
  primary:    '#00d4ff',
  secondary:  '#00ff88',
  warning:    '#ff9900',
  error:      '#ff4444',
  yellow:     '#ffcc00',

  bgDefault:  '#0d1128',
  bgPaper:    '#1e2139',
  bgSidebar:  '#12162e',
  bgTableHead:'#1a1f3a',

  textPrimary:   '#f0f4ff',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted:     'rgba(255,255,255,0.4)',
  border:        'rgba(255,255,255,0.06)',
};

// ─── Dimensiones estandarizadas de Cards ─────────────────
export const cardSizes = {
  /** Stat cards del dashboard (KPI) — 4 columnas iguales */
  stat: { height: 140, columns: { xs: 6, sm: 3 } },
  /** Cards de gráficos — grid 2 columnas iguales, full-width en mobile */
  chart: { height: 340, columns: { xs: 12, md: 6 } },
  /** Card ancha (ocupa fila completa) */
  chartWide: { height: 340, columns: { xs: 12 } },
  /** Cards de detalle (info fields) — 3 columnas */
  detail: { height: 'auto', columns: { xs: 12, sm: 6, md: 4 } },
  /** Cards de resultado (eficiencia, consumo, costo) — 3 columnas iguales */
  result: { height: 'auto', columns: { xs: 12, sm: 4 } },
};

// ─── Espaciado (en unidades de theme.spacing = 8px) ──────
export const spacing = {
  /** Gap uniforme de todos los grids de cards */
  gridGap: 2,
  /** Padding del contenido principal */
  pagePadding: { xs: 2, md: 3 },
  /** Margen inferior entre secciones */
  sectionGap: 4,
};

// ─── Bordes ──────────────────────────────────────────────
export const borderRadius = {
  card: 12,
  button: 10,
  chip: 16,
};

// ─── Tipografía (variantes custom) ───────────────────────
export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  /** Stat number */
  statValue: { fontWeight: 800, variant: 'h4' },
  /** Chart/section title */
  sectionTitle: { fontWeight: 700, variant: 'h6' },
  /** Card subtitle (chart label) */
  chartLabel: { variant: 'subtitle2' },
};

// ─── Backdrop de modales ─────────────────────────────────
export const modalBackdrop = {
  backdropFilter: 'blur(6px)',
  backgroundColor: 'rgba(0,0,0,0.6)',
};

// ─── Sidebar ─────────────────────────────────────────────
export const sidebar = {
  width: 256,
  topBarHeight: 56,
};

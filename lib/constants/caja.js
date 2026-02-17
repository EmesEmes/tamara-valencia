// ============================================================================
// CONSTANTS - MÓDULO DE CAJA
// ============================================================================

// Categorías de Egresos Recurrentes (ampliadas)
export const CATEGORIAS_EGRESO = [
  { value: "bancos", label: "Bancos (Préstamos/Tarjetas)" },
  { value: "servicios_basicos", label: "Servicios Básicos" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "transporte", label: "Transporte" },
  { value: "salud", label: "Salud" },
  { value: "recreacion", label: "Recreación" },
  { value: "vestimenta", label: "Vestimenta" },
  { value: "educacion", label: "Educación" },
  { value: "vivienda", label: "Vivienda" },
  { value: "impuestos", label: "Impuestos" },
  { value: "negocio", label: "Gastos del Negocio" },
  { value: "otros", label: "Otros" },
];

// Frecuencias de pago
export const FRECUENCIAS_EGRESO = [
  { value: "mensual", label: "Mensual" },
  { value: "quincenal", label: "Quincenal" },
  { value: "semanal", label: "Semanal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

// Tipos de recurrencia
export const TIPOS_RECURRENCIA = [
  { value: "fijo", label: "Monto Fijo (mismo monto cada mes)" },
  { value: "variable", label: "Monto Variable (cambia cada mes)" },
];

// Estados de pago
export const ESTADOS_PAGO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "atrasado", label: "Atrasado" },
  { value: "vencido", label: "Vencido" },
];

// Métodos de pago
export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "cheque", label: "Cheque" },
];

export type MessageType = "ok" | "error" | "info";

export interface PdfCell {
  texto: string;
  x: number;
  ancho: number;
}

export interface PdfRow {
  y: number;
  celdas: PdfCell[];
  texto: string;
}

export interface PdfPageData {
  filas: PdfRow[];
  texto: string;
}

export interface ExtractedPdfDocument {
  texto: string;
  pagina1: PdfPageData;
  pagina2: PdfPageData;
  paginas: PdfPageData[];
}

export interface ReportData {
  nombre_completo: string;
  edad: string;
  estado_civil: string;
  dirección_actual: string;
  pretension_salarial: string;
  inicio_laboral: string;
  fecha_que_estará_disponible: string;
  esposa: string;
  cantidad_hijos: string;
  hijo: string;
  con_hijos: string;
  edu_primaria: string;
  edu_secundaria: string;
  edu_diversificado: string;
  edu_universitario: string;
  edu_otros: string;
  empresa_1: string;
  periodo_1: string;
  puesto_1: string;
  motivo_1: string;
  salario_1: string;
  funciones_1: string;
  jefe_inmediato_1: string;
  empresa_2: string;
  periodo_2: string;
  puesto_2: string;
  motivo_2: string;
  salario_2: string;
  funciones_2: string;
  jefe_inmediato_2: string;
  empresa_3: string;
  periodo_3: string;
  puesto_3: string;
  motivo_3: string;
  salario_3: string;
  funciones_3: string;
  jefe_inmediato_3: string;
  fortalezas: string;
  tiene_disponibilidad_de_viajar: string;
  posee_vehiculo: string;
  vivienda: string;
  nombre_padre: string;
  ocupacion_padre: string;
  nombre_madre: string;
  ocupacion_madre: string;
  ocupacion: string;
  padece_enfermedad: string;
  padecimiento_especial: string;
  medicamento_actual: string;
  posee_armas: string;
  deudas_actualmente: string;
  demandas: string;
  familiares_carcel: string;
  grupo_delictivo: string;
  sindicato: string;
  perforaciones: string;
  tatuajes: string;
  bebidas_alcoholicas: string;
  fuma: string;
}

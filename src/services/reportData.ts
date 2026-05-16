import type { ExtractedPdfDocument, PdfCell, PdfPageData, PdfRow, ReportData } from "@/types/report";
import { buscarDato, esSi, formatearSalario, limpiar, normalizar } from "@/utils/text";

export function extraerDatosPDF(documento: ExtractedPdfDocument): ReportData {
  const datos = crearContextoBase();

  extraerDatosPersonales(documento, datos);
  extraerEducacion(documento, datos);
  extraerExperienciaLaboral(documento, datos);
  extraerFortalezas(documento, datos);
  extraerDatosFamiliares(documento, datos);
  extraerAspectosGenerales(documento, datos);

  return datos;
}

function crearContextoBase(): ReportData {
  return {
    nombre_completo: "-",
    edad: "-",
    estado_civil: "-",
    dirección_actual: "-",
    pretension_salarial: "-",
    inicio_laboral: "-",
    fecha_que_estará_disponible: "-",
    esposa: "-",
    cantidad_hijos: "0",
    hijo: "-",
    con_hijos: "Sin hijos",
    edu_primaria: "",
    edu_secundaria: "",
    edu_diversificado: "",
    edu_universitario: "",
    edu_otros: "",
    empresa_1: "-",
    periodo_1: "",
    puesto_1: "-",
    motivo_1: "-",
    salario_1: "-",
    funciones_1: "-",
    jefe_inmediato_1: "-",
    empresa_2: "-",
    periodo_2: "",
    puesto_2: "-",
    motivo_2: "-",
    salario_2: "-",
    funciones_2: "-",
    jefe_inmediato_2: "-",
    empresa_3: "-",
    periodo_3: "",
    puesto_3: "-",
    motivo_3: "-",
    salario_3: "-",
    funciones_3: "-",
    jefe_inmediato_3: "-",
    fortalezas: "",
    tiene_disponibilidad_de_viajar: "",
    posee_vehiculo: "",
    vivienda: "-",
    nombre_padre: "-",
    ocupacion_padre: "-",
    nombre_madre: "-",
    ocupacion_madre: "-",
    ocupacion: "-",
    padece_enfermedad: "No",
    padecimiento_especial: "No",
    medicamento_actual: "No",
    posee_armas: "No",
    deudas_actualmente: "No",
    demandas: "No",
    familiares_carcel: "No",
    grupo_delictivo: "No",
    sindicato: "No",
    perforaciones: "No",
    tatuajes: "No",
    bebidas_alcoholicas: "No",
    fuma: "No"
  };
}

function extraerDatosPersonales(documento: ExtractedPdfDocument, datos: ReportData): void {
  const pagina1 = documento.pagina1;

  datos.nombre_completo = valorOTexto(documento, pagina1, "Nombre Completo", "Edad");
  datos.edad = valorOTexto(documento, pagina1, "Edad", "Estado Civil");
  datos.estado_civil = limpiarFragmentosCortos(
    valorOTexto(documento, pagina1, "Estado Civil", "Dirección Actual")
  );
  datos.dirección_actual = valorOTexto(documento, pagina1, "Dirección Actual", "Fecha que estará disponible");
  datos.inicio_laboral = valorOTexto(documento, pagina1, "Fecha que estará disponible", "Pretensión salarial");
  datos.fecha_que_estará_disponible = datos.inicio_laboral;
  datos.pretension_salarial = valorOTexto(documento, pagina1, "Pretensión salarial");
}

function extraerDatosFamiliares(documento: ExtractedPdfDocument, datos: ReportData): void {
  const hijos: string[] = [];
  const filas = filasEntre(documento.pagina1, "DATOS FAMILIARES", "FORMACION ACADEMICA");
  const filasConParentesco = filas.filter(fila => {
    const parentesco = normalizar(textoColumna([fila], 175, 245));

    return esParentescoConyuge(parentesco) ||
      parentesco.includes("hija") ||
      parentesco.includes("hijo");
  });

  filasConParentesco.forEach((filaInicio, indice) => {
    const siguiente = filasConParentesco[indice + 1];
    const grupo = filas.filter(fila =>
      fila.y >= filaInicio.y && (!siguiente || fila.y < siguiente.y)
    );
    const nombre = limpiarNombrePersona(textoColumna(grupo, 55, 175));
    const parentesco = normalizar(textoColumna([filaInicio], 175, 245));
    const edad = limpiarCampoPDF(textoColumna(grupo, 300, 350));
    const ocupacion = limpiarCampoPDF(textoColumna(grupo, 350, 435));

    if (nombre === "-") return;

    if (esParentescoConyuge(parentesco)) {
      datos.esposa = nombre;
    }

    if (parentesco.includes("hija") || parentesco.includes("hijo")) {
      const descripcion = ocupacion !== "-" && ocupacion.toUpperCase() !== "N/A"
        ? `${nombre}, ${edad} años, ${ocupacion.toLowerCase()}`
        : `${nombre}, ${edad} años`;

      hijos.push(descripcion);
    }
  });

  if (hijos.length > 0) {
    datos.cantidad_hijos = String(hijos.length);
    datos.hijo = hijos.join("\n");
    datos.con_hijos = "Con hijos";
  }
}

function esParentescoConyuge(parentesco: string): boolean {
  return parentesco === "esposa" ||
    parentesco === "esposo" ||
    parentesco === "conyugue" ||
    parentesco === "conyuye";
}

function extraerEducacion(documento: ExtractedPdfDocument, datos: ReportData): void {
  const filas = filasEntre(documento.pagina1, "FORMACION ACADEMICA", "IDIOMAS");
  const niveles = filas.filter(fila => esFilaNivelAcademico(fila));

  niveles.forEach((filaInicio, indice) => {
    const siguiente = niveles[indice + 1];
    const grupo = filas.filter(fila =>
      fila.y >= filaInicio.y && (!siguiente || fila.y < siguiente.y)
    );
    const nivel = normalizar(textoColumna([filaInicio], 55, 125));
    const titulo = limpiarCampoPDF(textoColumna(grupo, 225, 350));
    const institucion = limpiarCampoPDF(textoColumna(grupo, 350, 465));
    const valor = construirValorAcademico(institucion, titulo);

    if (!valor) return;

    if (nivel.includes("primaria")) {
      datos.edu_primaria = valor;
    } else if (nivel.includes("secundaria")) {
      datos.edu_secundaria = valor;
    } else if (nivel.includes("diversificado")) {
      datos.edu_diversificado = valor;
    } else if (nivel.includes("universitario")) {
      datos.edu_universitario = valor;
    } else if (
      nivel.includes("especialidad") ||
      nivel.includes("diplomado") ||
      nivel.includes("post grado") ||
      nivel.includes("otro")
    ) {
      datos.edu_otros = valor;
    }
  });
}

function esFilaNivelAcademico(fila: PdfRow): boolean {
  const nivel = normalizar(textoColumna([fila], 55, 125));

  return [
    "primaria",
    "secundaria",
    "diversificado",
    "universitario",
    "especialidad",
    "diplomado",
    "post grado",
    "otro"
  ].some(valor => nivel.includes(valor));
}

function construirValorAcademico(institucion: string, titulo: string): string {
  const institucionLimpia = limpiarTextoAcademico(institucion);
  const tituloLimpio = limpiarTextoAcademico(titulo);

  if (institucionLimpia === "-" || tituloLimpio === "-") return "";

  return `${institucionLimpia} - ${tituloLimpio}`;
}

function extraerExperienciaLaboral(documento: ExtractedPdfDocument, datos: ReportData): void {
  const experiencias = construirExperienciasLaborales(documento.pagina2);

  experiencias.slice(0, 3).forEach((experiencia, indice) => {
    const numero = indice + 1;

    datos[`empresa_${numero}` as keyof ReportData] = experiencia.empresa;
    datos[`periodo_${numero}` as keyof ReportData] = experiencia.periodo;
    datos[`puesto_${numero}` as keyof ReportData] = experiencia.puesto;
    datos[`salario_${numero}` as keyof ReportData] = experiencia.salario;
    datos[`motivo_${numero}` as keyof ReportData] = experiencia.motivo;
    datos[`jefe_inmediato_${numero}` as keyof ReportData] = experiencia.jefeInmediato;
    datos[`funciones_${numero}` as keyof ReportData] = "";
  });
}

function construirExperienciasLaborales(pagina: PdfPageData): Array<{
  empresa: string;
  periodo: string;
  puesto: string;
  salario: string;
  motivo: string;
  jefeInmediato: string;
}> {
  let filas = filasEntre(pagina, "Lugar de", "REFERENCIAS PERSONALES");

  if (filas.length === 0) {
    filas = filasEntre(pagina, "Lugar de", "Referencias");
  }

  if (filas.length === 0) {
    filas = filasEntre(pagina, "Lugar de");
  }

  const filasConEmpresa = filas.filter(fila => {
    const empresa = textoColumna([fila], 55, 115);

    return empresa !== "-" &&
      !normalizar(empresa).includes("lugar de") &&
      !normalizar(empresa).includes("trabajo");
  });

  const inicios = filasConEmpresa.filter((fila, indice) => {
    const anterior = filasConEmpresa[indice - 1];

    return !anterior || fila.y - anterior.y > 45;
  });

  return inicios.map((inicio, indice) => {
    const siguiente = inicios[indice + 1];
    const grupo = filas.filter(fila =>
      fila.y >= inicio.y && (!siguiente || fila.y < siguiente.y)
    );

    return {
      empresa: limpiarCampoPDF(textoColumna(grupo, 55, 115)),
      periodo: extraerPeriodoLaborado(textoColumna(grupo, 250, 315)),
      puesto: limpiarCampoPDF(textoColumna(grupo, 315, 380)),
      salario: formatearSalario(limpiarCampoPDF(textoColumna(grupo, 380, 435))),
      motivo: limpiarCampoPDF(textoColumna(grupo, 430, 505)),
      jefeInmediato: limpiarCampoPDF(textoColumna(grupo, 505, 560))
    };
  });
}

function extraerFortalezas(documento: ExtractedPdfDocument, datos: ReportData): void {
  const aptitudes: string[] = [];
  let filas = filasEntre(documento.pagina2, "Aptitudes o cualidades personales", "Aspectos Generales");

  if (filas.length === 0) {
    filas = filasEntre(documento.pagina2, "Aptitudes o cualidades personales", "Tiene disponibilidad de viajar");
  }

  if (filas.length === 0) {
    filas = filasEntre(documento.pagina2, "Aptitudes o cualidades personales");
  }

  filas.forEach(fila => {
    const col1 = limpiar(fila.celdas[0]?.texto);
    const ignorar = ["Aptitudes o cualidades personales", "DATOS ADICIONALES", "-", ""];

    if (!ignorar.includes(col1) && col1.length > 2 && !aptitudes.includes(col1)) {
      aptitudes.push(col1);
    }
  });

  datos.fortalezas = aptitudes.length > 0 ? aptitudes.join(", ") : "";
}

function extraerAspectosGenerales(documento: ExtractedPdfDocument, datos: ReportData): void {
  const pagina1 = documento.pagina1;
  const disponibilidadViajar = buscarValorPorCampo(pagina1, "Tiene disponibilidad de viajar");
  const poseeVehiculo = buscarValorPorCampo(pagina1, "¿posee vehículo propio?");
  const licencia = buscarValorPorCampo(pagina1, "Licencia de conducir");

  datos.tiene_disponibilidad_de_viajar = esSi(disponibilidadViajar)
    ? "Disponibilidad de movilización"
    : "";

  if (esSi(poseeVehiculo) && esSi(licencia)) {
    datos.posee_vehiculo = "Posee vehículo y licencia vigente";
  } else if (esSi(poseeVehiculo)) {
    datos.posee_vehiculo = "Posee vehículo";
  }
}

function valorOTexto(
  documento: ExtractedPdfDocument,
  pagina: PdfPageData,
  campo: string,
  siguienteCampo: string | null = null
): string {
  const valorTabla = buscarValorPorCampo(pagina, campo);

  return valorTabla !== "-" ? valorTabla : buscarDato(documento.texto, campo, siguienteCampo);
}

function buscarValorPorCampo(pagina: PdfPageData, campo: string): string {
  const campoNormalizado = normalizar(campo);

  for (let indiceFila = 0; indiceFila < pagina.filas.length; indiceFila++) {
    const fila = pagina.filas[indiceFila];

    if (!normalizar(fila.texto).includes(campoNormalizado)) continue;

    for (let indiceCelda = 0; indiceCelda < fila.celdas.length; indiceCelda++) {
      const celda = fila.celdas[indiceCelda];
      const primeraPalabraCampo = campoNormalizado.split(" ")[0];

      if (!normalizar(celda.texto).includes(primeraPalabraCampo)) continue;

      const valorEnCelda = extraerValorEnCelda(celda.texto, campo);

      if (valorEnCelda !== "-") return valorEnCelda;

      const siguienteEtiqueta = fila.celdas
        .slice(indiceCelda + 1)
        .find(celdaSiguiente => pareceEtiqueta(celdaSiguiente.texto));

      for (let siguiente = indiceFila + 1; siguiente < Math.min(pagina.filas.length, indiceFila + 4); siguiente++) {
        const valorDebajo = buscarValorDebajoEnColumna(
          pagina.filas[siguiente],
          celda,
          siguienteEtiqueta
        );

        if (valorDebajo !== "-") return valorDebajo;
      }
    }
  }

  return "-";
}

function extraerValorEnCelda(texto: string, campo: string): string {
  const textoLimpio = limpiar(texto);
  const posicion = normalizar(textoLimpio).indexOf(normalizar(campo));

  if (posicion < 0) return "-";

  const despues = textoLimpio
    .slice(posicion + campo.length)
    .replace(/^[:\s-]+/, "")
    .trim();

  return despues && !pareceEtiqueta(despues) ? limpiar(despues) : "-";
}

function buscarValorDebajoEnColumna(
  fila: PdfRow,
  celdaReferencia: PdfCell,
  siguienteEtiqueta?: PdfCell
): string {
  const inicio = celdaReferencia.x - 8;
  const fin = siguienteEtiqueta ? siguienteEtiqueta.x - 8 : Number.POSITIVE_INFINITY;
  const texto = fila.celdas
    .filter(celda => celda.x >= inicio && celda.x < fin)
    .map(celda => celda.texto)
    .join(" ");
  const valor = limpiarCampoPDF(texto);

  return valor !== "-" && !pareceEtiqueta(valor) ? valor : "-";
}

function filasEntre(pagina: PdfPageData, inicio: string, fin: string | null = null): PdfRow[] {
  const indiceInicio = pagina.filas.findIndex(fila =>
    normalizar(fila.texto).includes(normalizar(inicio))
  );

  if (indiceInicio < 0) return [];

  const indiceFin = fin
    ? pagina.filas.findIndex((fila, indice) =>
        indice > indiceInicio && normalizar(fila.texto).includes(normalizar(fin))
      )
    : -1;

  if (fin && indiceFin < 0) return [];

  return pagina.filas.slice(indiceInicio + 1, indiceFin > -1 ? indiceFin : undefined);
}

function textoColumna(filas: PdfRow[], inicioX: number, finX: number): string {
  const lineas = filas
    .map(fila =>
      fila.celdas
        .filter(celda => celda.x >= inicioX && celda.x < finX)
        .map(celda => celda.texto)
        .join(" ")
    )
    .map(limpiarCampoPDF)
    .filter(linea => linea !== "-");

  return lineas.length > 0 ? lineas.join(" ") : "-";
}

function extraerPeriodoLaborado(texto: string): string {
  const normalizado = limpiarCampoPDF(texto)
    .replace(/\s*\/\s*/g, "/")
    .replace(/(\d{1,2}\/\d{1,2}\/\d{2})\s+(\d{2})/g, "$1$2");

  const fechas = normalizado.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];

  return fechas.map(formatearFechaCorta).join("\n");
}

function formatearFechaCorta(fecha: string): string {
  const [dia, mes, anio] = fecha.split("/");

  return [
    dia.padStart(2, "0"),
    mes.padStart(2, "0"),
    anio
  ].join("/");
}

function limpiarCampoPDF(valor: string): string {
  return limpiar(valor)
    .replace(/\s+/g, " ")
    .trim();
}

function limpiarTextoAcademico(valor: string): string {
  return recomponerFragmentosAcademicos(limpiarCampoPDF(valor))
    .replace(/\.(?=\s*-)/g, "")
    .replace(/\.$/g, "")
    .trim();
}

function limpiarNombrePersona(valor: string): string {
  return limpiarCampoPDF(valor)
    .replace(/(\p{L}{3,})\s+(\p{Ll})(?=\s|$)/gu, "$1$2")
    .replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2")
    .trim();
}

function limpiarFragmentosCortos(valor: string): string {
  return limpiarCampoPDF(valor)
    .replace(/(\p{L}{3,})\s+(\p{Ll})(?=\s|$)/gu, "$1$2")
    .trim();
}

function recomponerFragmentosAcademicos(valor: string): string {
  const conectores = new Set(["a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "o", "u", "un", "una", "y"]);
  const tokens = valor.split(/\s+/);
  const resultado: string[] = [];

  for (const token of tokens) {
    const anterior = resultado[resultado.length - 1];

    if (anterior && debeUnirFragmentoAcademico(anterior, token, conectores)) {
      resultado[resultado.length - 1] = anterior + token;
    } else {
      resultado.push(token);
    }
  }

  return resultado.join(" ");
}

function debeUnirFragmentoAcademico(
  anterior: string,
  actual: string,
  conectores: Set<string>
): boolean {
  const anteriorLimpio = anterior.replace(/[^\p{L}]$/u, "");
  const actualLimpio = actual.replace(/^[^\p{L}]/u, "");
  const actualEnMinuscula = actualLimpio.toLowerCase();

  if (!/^\p{L}{2,4}$/u.test(actualLimpio)) return false;
  if (!empiezaConMinuscula(actualLimpio)) return false;
  if (conectores.has(actualEnMinuscula)) return false;
  if (!/\p{L}$/u.test(anteriorLimpio)) return false;

  return anteriorLimpio.length >= 3;
}

function empiezaConMinuscula(valor: string): boolean {
  const primeraLetra = valor.match(/\p{L}/u)?.[0];

  return Boolean(
    primeraLetra &&
    primeraLetra === primeraLetra.toLowerCase() &&
    primeraLetra !== primeraLetra.toUpperCase()
  );
}

function pareceEtiqueta(valor: string): boolean {
  const texto = normalizar(valor);

  if (!texto || texto === "-") return true;

  return [
    "nombre completo",
    "lugar y fecha de nacimiento",
    "edad",
    "sexo",
    "estado civil",
    "direccion actual",
    "municipio",
    "departamento",
    "nacionalidad",
    "ident #",
    "rtn",
    "ihss",
    "afp",
    "telefono",
    "usuario de skype",
    "correo electronico",
    "fecha que estara disponible",
    "area de interes",
    "puesto de su interes",
    "pretension salarial",
    "tiene disponibilidad de viajar",
    "estudia actualmente",
    "en que horario",
    "posee vehiculo propio",
    "licencia de conducir",
    "tipo de licencia",
    "vencimiento",
    "lugar de trabajo",
    "trabajo",
    "puesto",
    "salario",
    "motivo",
    "jefe inmediato",
    "aptitudes o cualidades personales",
    "datos adicionales",
    "datos familiares",
    "datos de interes"
  ].some(etiqueta => texto.includes(etiqueta));
}

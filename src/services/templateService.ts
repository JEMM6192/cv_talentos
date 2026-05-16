import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZip from "pizzip";
import { REPORT_CONFIG } from "@/config/report";
import type { ReportData } from "@/types/report";

export async function cargarPlantillaWord(): Promise<ArrayBuffer> {
  const respuesta = await fetch(REPORT_CONFIG.templateUrl);

  if (!respuesta.ok) {
    throw new Error("No se encontró la plantilla Word en la carpeta public/templates.");
  }

  return respuesta.arrayBuffer();
}

export function generarDocumentoWord(plantillaBuffer: ArrayBuffer, datos: ReportData): Blob {
  const zip = new PizZip(plantillaBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: {
      start: "{{",
      end: "}}"
    },
    paragraphLoop: true,
    linebreaks: true
  });

  doc.render(datos);

  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
}

export function guardarDocumento(documento: Blob, datos: ReportData): void {
  saveAs(documento, obtenerNombreArchivo(datos));
}

function obtenerNombreArchivo(datos: ReportData): string {
  const nombre = datos.nombre_completo && datos.nombre_completo !== "-"
    ? datos.nombre_completo
    : "Candidato";

  return `${nombre} - INFORME DE SELECCION.docx`;
}

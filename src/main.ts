import type { MessageType } from "@/types/report";

const formulario = document.querySelector<HTMLFormElement>("[data-report-form]");
const inputPDF = document.querySelector<HTMLInputElement>("[data-pdf-input]");
const boton = document.querySelector<HTMLButtonElement>("[data-generate-button]");
const mensaje = document.querySelector<HTMLDivElement>("[data-message]");
const nombreArchivo = document.querySelector<HTMLDivElement>("[data-file-name]");
const metaArchivo = document.querySelector<HTMLDivElement>("[data-file-meta]");
const iconoArchivo = document.querySelector<HTMLSpanElement>("[data-file-status-icon]");

formulario?.addEventListener("submit", event => {
  event.preventDefault();
  void generarInforme();
});

inputPDF?.addEventListener("change", actualizarArchivoSeleccionado);

async function generarInforme(): Promise<void> {
  if (!inputPDF || !boton) return;

  const archivoPDF = inputPDF.files?.[0];

  if (!archivoPDF) {
    mostrarMensaje("Debe seleccionar un archivo PDF.", "error");
    return;
  }

  try {
    bloquearFormulario(true);
    mostrarMensaje("Procesando PDF, por favor espere...", "info");

    const [
      { extraerTextoPDF },
      { extraerDatosPDF },
      { cargarPlantillaWord, generarDocumentoWord, guardarDocumento }
    ] = await Promise.all([
      import("@/services/pdfExtraction"),
      import("@/services/reportData"),
      import("@/services/templateService")
    ]);

    const documentoPDF = await extraerTextoPDF(archivoPDF);
    const datosExtraidos = extraerDatosPDF(documentoPDF);
    const plantillaBuffer = await cargarPlantillaWord();
    const documentoFinal = generarDocumentoWord(plantillaBuffer, datosExtraidos);

    guardarDocumento(documentoFinal, datosExtraidos);
    mostrarMensaje("Informe generado correctamente.", "ok");
  } catch (error) {
    console.error(error);
    mostrarMensaje(`Error: ${obtenerMensajeError(error)}`, "error");
  } finally {
    bloquearFormulario(false);
  }
}

function bloquearFormulario(bloqueado: boolean): void {
  if (!boton) return;

  boton.disabled = bloqueado;
  boton.textContent = bloqueado ? "Generando informe..." : "Generar mi informe";
}

function mostrarMensaje(texto: string, tipo: MessageType = "info"): void {
  if (!mensaje) return;

  mensaje.textContent = texto;
  mensaje.dataset.type = tipo;
  mensaje.className = obtenerClasesMensaje(tipo);
  mensaje.hidden = false;
}

function actualizarArchivoSeleccionado(): void {
  const archivo = inputPDF?.files?.[0];

  if (!archivo) {
    if (nombreArchivo) nombreArchivo.textContent = "Selecciona un archivo PDF";
    if (metaArchivo) metaArchivo.textContent = "Solicitud de empleo • Informe Word";
    if (iconoArchivo) iconoArchivo.textContent = "add_circle";
    return;
  }

  if (nombreArchivo) nombreArchivo.textContent = archivo.name;
  if (metaArchivo) metaArchivo.textContent = `${formatearPesoArchivo(archivo.size)} • Listo para procesar`;
  if (iconoArchivo) iconoArchivo.textContent = "task_alt";
}

function formatearPesoArchivo(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;

  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function obtenerClasesMensaje(tipo: MessageType): string {
  const base = "mt-6 rounded-xl border px-4 py-3 text-sm font-semibold";

  if (tipo === "ok") {
    return `${base} border-green-200 bg-green-50 text-green-800`;
  }

  if (tipo === "error") {
    return `${base} border-error-container bg-error-container text-on-error-container`;
  }

  return `${base} border-blue-200 bg-blue-50 text-blue-900`;
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "No se pudo generar el informe.";
}

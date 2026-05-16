import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import type { ExtractedPdfDocument, PdfCell, PdfRow } from "@/types/report";
import { limpiar } from "@/utils/text";

interface PositionedText {
  texto: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extraerTextoPDF(archivoPDF: File): Promise<ExtractedPdfDocument> {
  const buffer = await archivoPDF.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const paginas = [];
  let textoCompleto = "";

  for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {
    const pagina = await pdf.getPage(numeroPagina);
    const contenido = await pagina.getTextContent();
    const viewport = pagina.getViewport({ scale: 1 });

    const items = contenido.items
      .map(item => {
        if (!("str" in item)) return null;

        return {
          texto: limpiar(item.str),
          x: item.transform[4],
          y: viewport.height - item.transform[5],
          ancho: item.width || 0,
          alto: item.height || 0
        };
      })
      .filter((item): item is PositionedText => Boolean(item && item.texto !== "-"));

    const filas = construirFilasVisuales(items);
    const textoPagina = filas.map(fila => fila.texto).join("\n");

    textoCompleto += `\n${textoPagina}`;
    paginas.push({ filas, texto: textoPagina });
  }

  return {
    texto: textoCompleto.replace(/\r/g, ""),
    pagina1: paginas[0] || { filas: [], texto: "" },
    pagina2: paginas[1] || { filas: [], texto: "" },
    paginas
  };
}

function construirFilasVisuales(items: PositionedText[]): PdfRow[] {
  const filas: Array<{ y: number; items: PositionedText[] }> = [];
  const toleranciaY = 3;

  items
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .forEach(item => {
      let fila = filas.find(actual => Math.abs(actual.y - item.y) <= toleranciaY);

      if (!fila) {
        fila = { y: item.y, items: [] };
        filas.push(fila);
      }

      fila.items.push(item);
    });

  return filas
    .sort((a, b) => a.y - b.y)
    .map(fila => {
      const celdas = agruparCeldas(fila.items);

      return {
        y: fila.y,
        celdas,
        texto: celdas.map(celda => celda.texto).join(" ")
      };
    });
}

function agruparCeldas(items: PositionedText[]): PdfCell[] {
  const celdas: PdfCell[] = [];

  items
    .sort((a, b) => a.x - b.x)
    .forEach(item => {
      const ultima = celdas[celdas.length - 1];
      const finUltima = ultima ? ultima.x + ultima.ancho : 0;
      const separacion = item.x - finUltima;

      if (ultima && separacion >= 0 && separacion < 12) {
        const separador = separacion < 2 ? "" : " ";

        ultima.texto = limpiar(`${ultima.texto}${separador}${item.texto}`);
        ultima.ancho = Math.max(ultima.ancho, item.x + item.ancho - ultima.x);
      } else {
        celdas.push({
          texto: item.texto,
          x: item.x,
          ancho: item.ancho
        });
      }
    });

  return celdas;
}

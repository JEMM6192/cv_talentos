export function limpiar(valor: unknown): string {
  if (valor === null || valor === undefined) return "-";

  const texto = String(valor)
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/"/g, "")
    .trim();

  return texto || "-";
}

export function convertirTitulo(texto: string): string {
  if (!texto || texto === "-") return "-";

  return texto
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_coincidencia, espacio: string, letra: string) =>
      `${espacio}${letra.toUpperCase()}`
    );
}

export function normalizar(valor: unknown): string {
  return limpiar(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function esSi(valor: unknown): boolean {
  return normalizar(valor) === "si";
}

export function buscarDato(
  texto: string,
  campo: string,
  siguienteCampo: string | null = null
): string {
  const patron = siguienteCampo
    ? new RegExp(`${campo}\\s*\\n?(.*?)\\n?${siguienteCampo}`, "is")
    : new RegExp(`${campo}\\s*\\n?(.*)`, "i");

  const resultado = texto.match(patron);

  return resultado ? limpiar(resultado[1]) : "-";
}

export function formatearSalario(salario: string): string {
  const valor = limpiar(salario);

  if (valor === "-") return "-";
  if (valor.startsWith("L.")) return valor;
  if (/^\d/.test(valor)) return `L. ${valor}`;

  return valor;
}

/**
 * Exportação CSV pensada para abrir no Excel em português.
 *
 * Duas armadilhas que justificam este módulo:
 * - O Excel em locale pt usa `;` como separador. Com `,` despeja tudo numa coluna.
 * - Sem BOM UTF-8, "Construções" chega como "ConstruÃ§Ãµes".
 */

const SEP = ";";
const BOM = "﻿";

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Um campo com separador, aspas ou quebra de linha tem de vir entre aspas,
  // e as aspas interiores duplicadas.
  return /["\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Número com vírgula decimal, como o Excel pt espera. */
export function csvNumber(n: number, decimals = 2) {
  return n.toFixed(decimals).replace(".", ",");
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(cell).join(SEP));
  // CRLF: o Excel é o consumidor alvo.
  return BOM + lines.join("\r\n");
}

/** Dispara a transferência no browser. Sem backend — o ficheiro é gerado aqui. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revogar já invalidaria o download em alguns browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function stamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

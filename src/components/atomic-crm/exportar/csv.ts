// CSV files that Excel opens as is: UTF-8 with a BOM (so accents show right),
// CRLF line ends, quoted text, and numbers left as numbers so they can be added.
export type Celda = string | number | null;

const BOM = "﻿";

// A text that starts with = + - @ (or a tab / carriage return) would run as a
// formula in Excel: prefix it with ' so it stays text (CSV injection).
const FORMULA = /^[=+\-@\t\r]/;

const celda = (valor: Celda): string => {
  if (valor === null) return "";
  if (typeof valor === "number") return String(valor);
  const texto = FORMULA.test(valor) ? `'${valor}` : valor;
  return `"${texto.replaceAll('"', '""')}"`;
};

export const toCsv = (filas: ReadonlyArray<ReadonlyArray<Celda>>): string =>
  BOM + filas.map((fila) => fila.map(celda).join(",")).join("\r\n") + "\r\n";

// First and last day of a month given as YYYY-MM (the value of
// <input type="month">), as YYYY-MM-DD.
export const rangoDelMes = (mes: string): { desde: string; hasta: string } => {
  const [year, month] = mes.split("-").map(Number);
  const ultimo = new Date(year, month, 0).getDate();
  return {
    desde: `${mes}-01`,
    hasta: `${mes}-${String(ultimo).padStart(2, "0")}`,
  };
};

export const mesActual = (hoy: Date = new Date()): string =>
  `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

// Saves the text as a file on the phone or computer.
export const descargar = (nombre: string, contenido: string): void => {
  const url = URL.createObjectURL(
    new Blob([contenido], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser time to read the file before freeing it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

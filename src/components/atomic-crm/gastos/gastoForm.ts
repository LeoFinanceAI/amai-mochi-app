import type { CategoriaGasto, Gasto } from "../types";
import { esPrecioValido } from "../precios/preciosForm";
import { toIsoDate } from "../pedidos/fechaEntrega";

export const CATEGORIAS: ReadonlyArray<CategoriaGasto> = [
  "ingredientes",
  "empaque",
  "transporte",
  "otro",
];

export interface GastoForm {
  monto: string;
  categoria: CategoriaGasto | null;
  fecha: string;
  descripcion: string;
}

export const formVacio = (hoy: Date = new Date()): GastoForm => ({
  monto: "",
  categoria: null,
  fecha: toIsoDate(hoy),
  descripcion: "",
});

// The row to insert, or null while something is missing. gasto.monto must be
// greater than 0 (CHECK in SQL).
export const toGasto = (form: GastoForm): Omit<Gasto, "id"> | null => {
  const monto = Number(form.monto.trim());
  if (
    !esPrecioValido(form.monto) ||
    monto <= 0 ||
    form.categoria == null ||
    !form.fecha
  ) {
    return null;
  }
  return {
    monto,
    categoria: form.categoria,
    fecha: form.fecha,
    descripcion: form.descripcion.trim() || null,
  };
};

// Monday of the date's week, as YYYY-MM-DD: the same week as v_resumen_semanal
// (date_trunc('week'), Monday to Sunday).
export const lunesDeLaSemana = (hoy: Date = new Date()): string => {
  const diasDesdeLunes = (hoy.getDay() + 6) % 7;
  return toIsoDate(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diasDesdeLunes),
  );
};

export const totalDesde = (gastos: Gasto[], desde: string): number =>
  gastos
    .filter((gasto) => gasto.fecha >= desde)
    .reduce((total, gasto) => total + Number(gasto.monto), 0);

// Days back the screen lists (a bit more than four weeks).
export const DIAS_DE_HISTORIA = 35;

export const fechaDesde = (dias: number, hoy: Date = new Date()): string =>
  toIsoDate(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias));

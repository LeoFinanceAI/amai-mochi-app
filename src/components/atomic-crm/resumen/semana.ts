import { lunesDeLaSemana } from "../gastos/gastoForm";
import { fromIsoDate, toIsoDate } from "../pedidos/fechaEntrega";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// The Monday to show: the one in the address (?semana=...) if valid, else this
// week's. A future week is never shown.
export const lunesElegido = (
  param: string | null,
  hoy: Date = new Date(),
): string => {
  const actual = lunesDeLaSemana(hoy);
  if (!param || !ISO_DATE.test(param)) return actual;
  const lunes = lunesDeLaSemana(fromIsoDate(param));
  return lunes > actual ? actual : lunes;
};

export const moverSemanas = (lunes: string, semanas: number): string => {
  const fecha = fromIsoDate(lunes);
  return toIsoDate(
    new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate() + 7 * semanas,
    ),
  );
};

// Change against last week, rounded: null when last week had no sales.
export const cambioPorcentual = (
  actual: number,
  anterior: number,
): number | null =>
  anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : null;

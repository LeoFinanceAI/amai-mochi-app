import { mesActual } from "../exportar/csv";

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

// The month to show, YYYY-MM: the one in the address (?mes=...) if valid, else
// this month. A future month is never shown.
export const mesElegido = (
  param: string | null,
  hoy: Date = new Date(),
): string => {
  const actual = mesActual(hoy);
  if (!param || !MES.test(param)) return actual;
  return param > actual ? actual : param;
};

export const moverMeses = (mes: string, meses: number): string => {
  const [year, month] = mes.split("-").map(Number);
  return mesActual(new Date(year, month - 1 + meses, 1));
};

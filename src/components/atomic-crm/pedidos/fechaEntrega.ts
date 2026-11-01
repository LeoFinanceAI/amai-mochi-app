export type OpcionEntrega = "manana" | "pasado" | "otra";

export const OPCIONES_ENTREGA: ReadonlyArray<OpcionEntrega> = [
  "manana",
  "pasado",
  "otra",
];

const DAYS_AHEAD: Record<Exclude<OpcionEntrega, "otra">, number> = {
  manana: 1,
  pasado: 2,
};

// YYYY-MM-DD in the phone's local time zone (toISOString would use UTC and
// turn tonight's orders into tomorrow's).
export const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// The delivery date for the chosen option; "" when "Other date" has none yet.
export const fechaEntrega = (
  opcion: OpcionEntrega,
  otraFecha: string,
  hoy: Date = new Date(),
): string =>
  opcion === "otra" ? otraFecha : toIsoDate(addDays(hoy, DAYS_AHEAD[opcion]));

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Parses YYYY-MM-DD as a local calendar date.
export const fromIsoDate = (fecha: string): Date => {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Whole days from today to the date: 0 today, 1 tomorrow, -1 yesterday.
export const diasDesdeHoy = (fecha: string, hoy: Date = new Date()): number =>
  Math.round(
    (fromIsoDate(fecha).getTime() - addDays(hoy, 0).getTime()) / MS_PER_DAY,
  );

// The chip that matches a saved delivery date, for editing an order.
export const opcionDeFecha = (
  fecha: string,
  hoy: Date = new Date(),
): { entrega: OpcionEntrega; otraFecha: string } => {
  if (fecha === fechaEntrega("manana", "", hoy)) {
    return { entrega: "manana", otraFecha: "" };
  }
  if (fecha === fechaEntrega("pasado", "", hoy)) {
    return { entrega: "pasado", otraFecha: "" };
  }
  return { entrega: "otra", otraFecha: fecha };
};

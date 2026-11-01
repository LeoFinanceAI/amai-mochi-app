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

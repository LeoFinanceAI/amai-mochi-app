// Display helpers shared by the order screens.

// Always Mexican pesos as written in Mexico ("$1,200"), whatever the UI language.
export const formatoDinero = (monto: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(monto);

export const formatoFecha = (fecha: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(fecha);

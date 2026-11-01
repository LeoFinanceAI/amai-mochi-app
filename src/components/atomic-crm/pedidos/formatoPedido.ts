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

const WEB_LINK = /^https?:\/\//i;

// Opens the delivery location in Maps: a link the client sent is used as is;
// an address is searched, with the client's area so Maps picks the right city.
// Anything else that looks like a link (javascript:, data:...) is searched as
// text, never opened.
export const mapsUrl = (direccion: string, zona: string | null): string => {
  const destino = direccion.trim();
  if (WEB_LINK.test(destino)) {
    return destino;
  }
  const query = [destino, zona].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

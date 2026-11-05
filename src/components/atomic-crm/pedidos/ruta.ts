import type { PedidoLista } from "../types";

// Google Maps directions links take one destination plus up to 9 stops.
export const MAX_PARADAS = 10;

const WEB_LINK = /^https?:\/\//i;

export interface Ruta {
  // Directions from where the phone is, through every stop; null with none.
  url: string | null;
  paradas: number;
  // Orders left out: a Maps link (cannot be a stop), no address, or past
  // the limit of stops.
  conEnlace: number;
  sinDireccion: number;
  fueraDelLimite: number;
}

// The route of the pending deliveries, in the order given. Each address goes
// with the client's area, as when a single address is opened; the same place
// twice is one stop.
export const rutaDeEntregas = (pedidos: ReadonlyArray<PedidoLista>): Ruta => {
  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const direcciones = pendientes
    .map((p) => p.direccion?.trim() ?? "")
    .map((direccion, i) => ({ direccion, zona: pendientes[i].zona }));
  const conEnlace = direcciones.filter((d) => WEB_LINK.test(d.direccion));
  const sinDireccion = direcciones.filter((d) => !d.direccion);
  const lugares = [
    ...new Set(
      direcciones
        .filter((d) => d.direccion && !WEB_LINK.test(d.direccion))
        .map((d) => [d.direccion, d.zona].filter(Boolean).join(", ")),
    ),
  ];
  const paradas = lugares.slice(0, MAX_PARADAS);
  const resumen = {
    paradas: paradas.length,
    conEnlace: conEnlace.length,
    sinDireccion: sinDireccion.length,
    fueraDelLimite: lugares.length - paradas.length,
  };
  if (!paradas.length) return { url: null, ...resumen };

  const destino = paradas.at(-1)!;
  const intermedias = paradas.slice(0, -1);
  const params = [
    "api=1",
    "travelmode=driving",
    `destination=${encodeURIComponent(destino)}`,
    ...(intermedias.length
      ? [`waypoints=${intermedias.map(encodeURIComponent).join("%7C")}`]
      : []),
  ];
  return {
    url: `https://www.google.com/maps/dir/?${params.join("&")}`,
    ...resumen,
  };
};

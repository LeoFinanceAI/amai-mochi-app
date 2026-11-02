import type { CobranzaPendiente } from "../types";

// Orders older than this are highlighted (business rule from the mockups).
export const DIAS_ALERTA = 7;

export interface DeudaCliente {
  clienteId: number;
  nombre: string;
  zona: string | null;
  telefono: string | null;
  total: number;
  pedidos: CobranzaPendiente[];
  diasMax: number;
  // Some order still has no price: it cannot be marked paid yet.
  tieneSinPrecio: boolean;
}

// One entry per client, the longest-waiting first; their orders oldest first.
export const agruparPorCliente = (
  filas: ReadonlyArray<CobranzaPendiente>,
): DeudaCliente[] => {
  const porCliente = new Map<number, CobranzaPendiente[]>();
  for (const fila of filas) {
    porCliente.set(fila.cliente_id, [
      ...(porCliente.get(fila.cliente_id) ?? []),
      fila,
    ]);
  }
  return [...porCliente.values()]
    .map((pedidos) => {
      const ordenados = [...pedidos].sort((a, b) => b.dias - a.dias);
      const [primero] = ordenados;
      return {
        clienteId: primero.cliente_id,
        nombre: primero.nombre,
        zona: primero.zona,
        telefono: primero.telefono,
        total: ordenados.reduce((suma, p) => suma + Number(p.total), 0),
        pedidos: ordenados,
        diasMax: primero.dias,
        tieneSinPrecio: ordenados.some((p) => Number(p.total) <= 0),
      };
    })
    .sort((a, b) => b.diasMax - a.diasMax || a.nombre.localeCompare(b.nombre));
};

export const estaVencido = (deuda: DeudaCliente) => deuda.diasMax > DIAS_ALERTA;

// wa.me needs the country code: a 10-digit Mexican number gets 52 in front.
// Returns null when the client has no phone.
export const whatsappUrl = (
  telefono: string | null,
  mensaje: string,
): string | null => {
  if (!telefono) return null;
  const numero = telefono.length === 10 ? `52${telefono}` : telefono;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};

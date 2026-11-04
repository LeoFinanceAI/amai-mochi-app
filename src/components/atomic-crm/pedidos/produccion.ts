import type { PedidoLista } from "../types";

export interface SaborAPreparar {
  saborId: number;
  nombre: string;
  color: string;
  piezas: number;
}

// Pieces to prepare per flavor for a set of orders, most pieces first.
export const piezasPorSabor = (
  pedidos: ReadonlyArray<PedidoLista>,
): SaborAPreparar[] => {
  const porSabor = new Map<number, SaborAPreparar>();
  for (const sabor of pedidos.flatMap((pedido) => pedido.sabores)) {
    const actual = porSabor.get(sabor.sabor_id);
    porSabor.set(sabor.sabor_id, {
      saborId: sabor.sabor_id,
      nombre: sabor.nombre,
      color: sabor.color,
      piezas: (actual?.piezas ?? 0) + sabor.cantidad,
    });
  }
  return [...porSabor.values()].sort(
    (a, b) => b.piezas - a.piezas || a.nombre.localeCompare(b.nombre, "es"),
  );
};

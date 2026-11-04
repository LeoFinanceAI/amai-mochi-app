import { describe, expect, it } from "vitest";

import type { CobranzaPendiente } from "../types";
import { agruparPorCliente, estaVencido } from "./cobranza";

const fila = (
  id: number,
  cliente_id: number,
  dias: number,
  total: number,
): CobranzaPendiente => ({
  id,
  pedido_id: id,
  cliente_id,
  nombre: `Cliente ${cliente_id}`,
  zona: null,
  telefono: null,
  fecha_entrega: "2026-10-20",
  piezas: 40,
  total,
  dias,
});

describe("agruparPorCliente", () => {
  it("adds each client's orders and puts the longest wait first", () => {
    // Act
    const deudas = agruparPorCliente([
      fila(1, 1, 3, 1000),
      fila(2, 2, 10, 500),
      fila(3, 1, 9, 800),
    ]);

    // Assert
    expect(
      deudas.map((d) => [d.clienteId, d.total, d.pedidos.map((p) => p.id)]),
    ).toEqual([
      [2, 500, [2]],
      [1, 1800, [3, 1]],
    ]);
    expect(deudas.map(estaVencido)).toEqual([true, true]);
  });

  it("flags a client with an order that has no price", () => {
    // Act
    const [deuda] = agruparPorCliente([fila(1, 1, 2, 0), fila(2, 1, 1, 300)]);

    // Assert
    expect(deuda.tieneSinPrecio).toBe(true);
    expect(estaVencido(deuda)).toBe(false);
  });
});

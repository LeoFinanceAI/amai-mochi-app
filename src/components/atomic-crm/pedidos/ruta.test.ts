import { describe, expect, it } from "vitest";

import type { PedidoLista } from "../types";
import { MAX_PARADAS, rutaDeEntregas } from "./ruta";

// Made-up addresses: never real customer data in tests.
const pedido = (
  id: number,
  direccion: string | null,
  overrides: Partial<PedidoLista> = {},
): PedidoLista => ({
  id,
  cliente_id: id,
  cliente: `Cliente ${id}`,
  zona: "Guadalajara",
  telefono: null,
  fecha_pedido: "2026-11-05T10:00:00Z",
  fecha_entrega: "2026-11-05",
  estado: "pendiente",
  metodo_pago: "efectivo",
  direccion,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
  piezas: 40,
  total: 1000,
  sabores: [],
  ...overrides,
});

const paradasDe = (url: string) => {
  const params = new URL(url).searchParams;
  return {
    destino: params.get("destination"),
    intermedias: params.get("waypoints")?.split("|") ?? [],
  };
};

describe("rutaDeEntregas", () => {
  it("goes through every pending address, ending at the last one", () => {
    // Act
    const ruta = rutaDeEntregas([
      pedido(1, "Av. Juárez 100"),
      pedido(2, "Calle Hidalgo 5", { zona: "Colima" }),
      pedido(3, "Av. Vallarta 20"),
      pedido(4, "Av. Patria 1", { estado: "entregado" }),
    ]);

    // Assert
    expect(ruta.paradas).toBe(3);
    expect(ruta.url).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1/);
    expect(paradasDe(ruta.url!)).toEqual({
      destino: "Av. Vallarta 20, Guadalajara",
      intermedias: ["Av. Juárez 100, Guadalajara", "Calle Hidalgo 5, Colima"],
    });
  });

  it("leaves out Maps links and orders with no address, and counts them", () => {
    // Act
    const ruta = rutaDeEntregas([
      pedido(1, "https://maps.app.goo.gl/abc"),
      pedido(2, null),
      pedido(3, "  "),
      pedido(4, "Av. Juárez 100"),
      pedido(5, "Av. Juárez 100"),
    ]);

    // Assert
    expect(ruta).toMatchObject({
      paradas: 1,
      conEnlace: 1,
      sinDireccion: 2,
      fueraDelLimite: 0,
    });
    expect(paradasDe(ruta.url!)).toEqual({
      destino: "Av. Juárez 100, Guadalajara",
      intermedias: [],
    });
  });

  it("stops at the most stops a Maps link takes", () => {
    // Act
    const ruta = rutaDeEntregas(
      Array.from({ length: MAX_PARADAS + 2 }, (_, i) =>
        pedido(i + 1, `Calle ${i + 1}`),
      ),
    );

    // Assert
    expect(ruta.paradas).toBe(MAX_PARADAS);
    expect(ruta.fueraDelLimite).toBe(2);
    expect(paradasDe(ruta.url!).intermedias).toHaveLength(MAX_PARADAS - 1);
  });

  it("has no route when nothing is left to deliver", () => {
    expect(rutaDeEntregas([pedido(1, null)]).url).toBeNull();
  });
});

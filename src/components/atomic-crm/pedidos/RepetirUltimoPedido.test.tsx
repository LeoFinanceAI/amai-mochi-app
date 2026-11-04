import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
const cliente = (id: number, nombre: string): Cliente => ({
  id,
  nombre,
  tipo: "distribuidor",
  zona: null,
  telefono: null,
  notas: null,
  activo: true,
});

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
  { id: 3, nombre: "Matcha", color: "#8A9A3E", activo: false },
];

const pedido = (
  id: number,
  fecha_pedido: string,
  overrides: Partial<Pedido> = {},
): Pedido => ({
  id,
  cliente_id: 1,
  fecha_pedido,
  fecha_entrega: fecha_pedido.slice(0, 10),
  estado: "entregado",
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
  ...overrides,
});

const linea = (
  id: number,
  pedido_id: number,
  sabor: number,
  cantidad: number,
): PedidoDetalle => ({
  id,
  pedido_id,
  producto_id: sabor,
  cantidad,
  precio_unitario: 30,
});

// Tienda Centro: an older order, then its latest real order (Fresa 25, Mango
// 15, Matcha 10 now retired, by transfer, to Av. Juárez 100), then a newer
// one that was cancelled. Café Norte has never ordered.
const openNuevoPedido = async () => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path: "/orders/new",
    data: {
      cliente: [cliente(1, "Tienda Centro"), cliente(2, "Café Norte")],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, "2026-10-20T10:00:00Z"),
        pedido(2, "2026-10-27T10:00:00Z", {
          metodo_pago: "transferencia",
          direccion: "Av. Juárez 100",
        }),
        pedido(3, "2026-10-30T10:00:00Z", { estado: "cancelado" }),
      ],
      pedido_detalle: [
        linea(1, 1, 1, 40),
        linea(2, 2, 1, 25),
        linea(3, 2, 2, 15),
        linea(4, 2, 3, 10),
        linea(5, 3, 2, 80),
      ],
    },
    dataProvider: (base) => {
      store = base;
      return base;
    },
  });
  const guardado = async (id: number) =>
    (
      await store!.getOne<
        Pedido & { sabores: Array<{ nombre: string; cantidad: number }> }
      >("pedido", { id })
    ).data;
  return { screen, guardado };
};

describe("repeat the last order", () => {
  it("fills the form with the client's last order and saves it as new", async () => {
    // Arrange
    const { screen, guardado } = await openNuevoPedido();
    await screen.getByText("Tienda Centro").click();

    // Act
    await expect.element(screen.getByText("Fresa 25 · Mango 15")).toBeVisible();
    await screen
      .getByRole("button", { name: "Repetir el último pedido" })
      .click();

    // Assert: the cancelled order and the retired flavor are left out.
    await expect
      .element(screen.getByRole("status", { name: "Piezas de Fresa" }))
      .toHaveTextContent("25");
    await expect
      .element(screen.getByRole("status", { name: "Piezas de Mango" }))
      .toHaveTextContent("15");
    await expect
      .element(screen.getByRole("radio", { name: "Transferencia" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("textbox", { name: "Ubicación" }))
      .toHaveValue("Av. Juárez 100");
    await expect
      .element(screen.getByRole("button", { name: "Repetir el último pedido" }))
      .not.toBeInTheDocument();

    // Act: save it
    await screen.getByRole("button", { name: "Guardar pedido" }).click();

    // Assert
    await expect
      .element(
        screen.getByText(
          "Pedido guardado. Queda pendiente de entrega y cobro.",
        ),
      )
      .toBeVisible();
    const nuevo = await guardado(4);
    expect(nuevo.estado).toBe("pendiente");
    expect(nuevo.sabores.map((s) => [s.nombre, s.cantidad])).toEqual([
      ["Fresa", 25],
      ["Mango", 15],
    ]);
  });

  it("offers nothing for a client who never ordered", async () => {
    // Arrange: a client with orders shows the offer...
    const { screen } = await openNuevoPedido();
    await screen.getByText("Tienda Centro").click();
    const repetir = screen.getByRole("button", {
      name: "Repetir el último pedido",
    });
    await expect.element(repetir).toBeVisible();

    // Act: ...switching to one who never ordered
    await screen.getByText("Café Norte").click();

    // Assert
    await expect.element(repetir).not.toBeInTheDocument();
    await expect
      .element(screen.getByText("Fresa 25 · Mango 15"))
      .not.toBeInTheDocument();
  });
});

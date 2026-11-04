import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

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
];

const dia = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const pedido = (id: number, cliente_id: number, offset: number): Pedido => ({
  id,
  cliente_id,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: dia(offset),
  estado: "pendiente",
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
});

const linea = (id: number): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id: 1,
  cantidad: 40,
  precio_unitario: 25,
});

const openOrders = (path = "/orders") =>
  renderMobileApp({
    path,
    data: {
      cliente: [
        cliente(1, "Tienda Centro"),
        cliente(2, "Café Norte"),
        cliente(3, "Tienda Sur"),
      ],
      sabor: sabores(),
      pedido: [pedido(1, 1, 1), pedido(2, 2, 1), pedido(3, 3, 2)],
      pedido_detalle: [linea(1), linea(2), linea(3)],
    },
  });

type Screen = Awaited<ReturnType<typeof openOrders>>;

const clientesListados = (screen: Screen) =>
  screen
    .getByRole("main")
    .getByRole("listitem")
    .elements()
    .filter((item) => item.querySelector("span.font-semibold"))
    .map((item) => item.querySelector("span.font-semibold")?.textContent);

describe("searching orders", () => {
  it("finds orders by any part of the client's name, ignoring case", async () => {
    // Arrange
    const screen = await openOrders();
    await expect.element(screen.getByText("Café Norte")).toBeVisible();

    // Act
    await screen
      .getByRole("searchbox", { name: "Buscar por cliente" })
      .fill("tienda");

    // Assert
    await expect
      .poll(() => clientesListados(screen))
      .toEqual(["Tienda Centro", "Tienda Sur"]);
  });

  it("finds the orders of one delivery day and keeps it in the address", async () => {
    // Act
    const screen = await openOrders(`/orders?fecha=${dia(2)}`);

    // Assert
    await expect.element(screen.getByText("Tienda Sur")).toBeVisible();
    expect(clientesListados(screen)).toEqual(["Tienda Sur"]);
    await expect
      .element(screen.getByLabelText("Día de entrega"))
      .toHaveValue(dia(2));
  });

  it("says when nothing matches and clears the search", async () => {
    // Arrange
    const screen = await openOrders();
    await screen
      .getByRole("searchbox", { name: "Buscar por cliente" })
      .fill("Boda");
    await expect
      .element(screen.getByText("Ningún pedido coincide con la búsqueda."))
      .toBeVisible();

    // Act
    await screen.getByRole("button", { name: "Limpiar" }).click();

    // Assert
    await expect.element(screen.getByText("Café Norte")).toBeVisible();
    await expect
      .element(screen.getByRole("searchbox", { name: "Buscar por cliente" }))
      .toHaveValue("");
  });
});

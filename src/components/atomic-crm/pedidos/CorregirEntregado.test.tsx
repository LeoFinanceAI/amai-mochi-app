import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

import type { Cliente, Pago, Pedido, PedidoDetalle, Sabor } from "../types";

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

const ayer = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString("en-CA");
};

const pedido = (id: number, cliente_id: number): Pedido => ({
  id,
  cliente_id,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: ayer(),
  estado: "entregado",
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: new Date().toISOString(),
});

const linea = (id: number): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id: 1,
  cantidad: 40,
  precio_unitario: 25,
});

// Two delivered orders of $1,000: Tienda Centro's is paid, Café Norte's not.
const openDelivered = async () => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path: "/orders?estado=entregado",
    data: {
      cliente: [cliente(1, "Tienda Centro"), cliente(2, "Café Norte")],
      sabor: sabores(),
      pedido: [pedido(1, 1), pedido(2, 2)],
      pedido_detalle: [linea(1), linea(2)],
      pago: [
        {
          id: 1,
          cliente_id: 1,
          pedido_id: 1,
          fecha: ayer(),
          monto: 1000,
          metodo: "efectivo",
          referencia: null,
          notas: null,
        } satisfies Pago,
      ],
    },
    dataProvider: (base) => {
      store = base;
      return base;
    },
  });
  const all = {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "id", order: "ASC" as const },
    filter: {},
  };
  const leer = async () => ({
    estados: (await store!.getList<Pedido>("pedido", all)).data.map(
      (p) => p.estado,
    ),
    pagos: (await store!.getList<Pago>("pago", all)).data.length,
  });
  return { screen, leer };
};

type Screen = Awaited<ReturnType<typeof openDelivered>>["screen"];

const card = (screen: Screen, nombre: string) =>
  screen
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: nombre })
    .first();

describe("fixing a delivered order", () => {
  it("asks before cancelling a paid order and removes its payment", async () => {
    // Arrange
    const { screen, leer } = await openDelivered();
    const tienda = card(screen, "Tienda Centro");

    // Act
    await tienda.getByRole("button", { name: "Cancelar" }).click();
    await expect
      .element(
        tienda.getByText(
          "Este pedido ya está cobrado ($1,000). Si lo cancelas, se borra ese pago.",
        ),
      )
      .toBeVisible();
    await tienda.getByRole("button", { name: "Sí, borrar el pago" }).click();

    // Assert
    await expect.element(screen.getByText("Pedido cancelado")).toBeVisible();
    await expect
      .element(screen.getByText("Tienda Centro"))
      .not.toBeInTheDocument();
    expect(await leer()).toEqual({
      estados: ["cancelado", "entregado"],
      pagos: 0,
    });
  });

  it("keeps everything when the warning is dismissed", async () => {
    // Arrange
    const { screen, leer } = await openDelivered();
    const tienda = card(screen, "Tienda Centro");
    await tienda.getByRole("button", { name: "Regresar a pendiente" }).click();
    await expect
      .element(tienda.getByText(/Si lo regresas a pendiente/))
      .toBeVisible();

    // Act
    await tienda.getByRole("button", { name: "Cancelar" }).last().click();

    // Assert
    await expect
      .element(tienda.getByText(/Si lo regresas a pendiente/))
      .not.toBeInTheDocument();
    expect(await leer()).toEqual({
      estados: ["entregado", "entregado"],
      pagos: 1,
    });
  });

  it("cancels an unpaid delivered order without asking", async () => {
    // Arrange
    const { screen, leer } = await openDelivered();

    // Act
    await card(screen, "Café Norte")
      .getByRole("button", { name: "Cancelar" })
      .click();
    await screen.getByRole("button", { name: /close/i }).click();

    // Assert
    await expect
      .poll(async () => (await leer()).estados)
      .toEqual(["entregado", "cancelado"]);
  });
});

import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
const clientes = (): Cliente[] => [
  {
    id: 1,
    nombre: "Distribuidor Centro",
    tipo: "distribuidor",
    zona: "Guadalajara",
    telefono: null,
    notas: null,
    activo: true,
  },
  {
    id: 2,
    nombre: "Antigua tienda",
    tipo: "distribuidor",
    zona: "Colima",
    telefono: null,
    notas: null,
    activo: false,
  },
];

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
  { id: 3, nombre: "Matcha", color: "#8A9A3E", activo: false },
];

// Tomorrow as YYYY-MM-DD in local time, computed independently of the app.
const manana = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString("en-CA");
};

const openNuevoPedido = async (
  dataProvider?: (base: DataProvider) => DataProvider,
) => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path: "/orders/new",
    data: { cliente: clientes(), sabor: sabores() },
    dataProvider: (base) => {
      store = base;
      return dataProvider ? (dataProvider(base) as typeof base) : base;
    },
  });
  const saved = async () => {
    const list = { pagination: { page: 1, perPage: 50 } } as const;
    const pedidos = await store!.getList<Pedido>("pedido", {
      ...list,
      sort: { field: "id", order: "ASC" },
    });
    const detalle = await store!.getList<PedidoDetalle>("pedido_detalle", {
      ...list,
      sort: { field: "producto_id", order: "ASC" },
    });
    return { pedidos: pedidos.data, detalle: detalle.data };
  };
  return { screen, saved };
};

type Screen = Awaited<ReturnType<typeof openNuevoPedido>>["screen"];

const addFive = (screen: Screen, sabor: string) =>
  screen.getByRole("button", { name: `Agregar 5 piezas de ${sabor}` }).click();

describe("Nuevo pedido screen", () => {
  it("offers only active clients and flavors", async () => {
    // Act
    const { screen } = await openNuevoPedido();

    // Assert
    await expect
      .element(
        screen.getByRole("radio", {
          name: "Distribuidor Centro · Guadalajara",
        }),
      )
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("radio", { name: /Antigua tienda/ }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByText("Fresa")).toBeVisible();
    await expect.element(screen.getByText("Matcha")).not.toBeInTheDocument();
  });

  it("warns below 40 pieces without blocking, and counts +5 and −", async () => {
    // Arrange
    const { screen } = await openNuevoPedido();
    await screen.getByText("Distribuidor Centro · Guadalajara").click();

    // Act
    await addFive(screen, "Fresa");
    await addFive(screen, "Fresa");
    await screen
      .getByRole("button", { name: "Quitar una pieza de Fresa" })
      .click();

    // Assert
    await expect
      .element(screen.getByRole("status", { name: "Piezas de Fresa" }))
      .toHaveTextContent("9");
    await expect
      .element(screen.getByText("Faltan 31 piezas para el mínimo de 40"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Guardar pedido" }))
      .toBeEnabled();
  });

  it("says the minimum is met at 40 pieces", async () => {
    // Arrange
    const { screen } = await openNuevoPedido();

    // Act
    for (let i = 0; i < 8; i++) {
      await addFive(screen, "Mango");
    }

    // Assert
    await expect
      .element(screen.getByText("Cumple el mínimo de 40 piezas"))
      .toBeVisible();
  });

  it("keeps Save disabled until a client and a flavor are chosen", async () => {
    // Arrange
    const { screen } = await openNuevoPedido();
    const save = screen.getByRole("button", { name: "Guardar pedido" });

    // Act + Assert
    await expect.element(save).toBeDisabled();
    await expect.element(screen.getByText("Elige un cliente")).toBeVisible();
    await screen.getByText("Distribuidor Centro · Guadalajara").click();
    await expect.element(save).toBeDisabled();
    await expect
      .element(screen.getByText("Agrega al menos un sabor"))
      .toBeVisible();
    await addFive(screen, "Fresa");
    await expect.element(save).toBeEnabled();
  });

  it("asks for a date when delivery is on another day", async () => {
    // Arrange
    const { screen } = await openNuevoPedido();
    await screen.getByText("Distribuidor Centro · Guadalajara").click();
    await addFive(screen, "Fresa");

    // Act
    await screen.getByText("Otra fecha").click();

    // Assert
    await expect
      .element(screen.getByRole("button", { name: "Guardar pedido" }))
      .toBeDisabled();
    await expect
      .element(screen.getByText("Elige la fecha de entrega"))
      .toBeVisible();
  });

  it("saves the order with its pieces per flavor and starts a new one", async () => {
    // Arrange
    const { screen, saved } = await openNuevoPedido();
    await screen.getByText("Distribuidor Centro · Guadalajara").click();
    await addFive(screen, "Fresa");
    await addFive(screen, "Fresa");
    await addFive(screen, "Mango");
    await screen.getByText("Transferencia").click();
    await screen
      .getByRole("textbox", { name: "Ubicación" })
      .fill("https://maps.app.goo.gl/ejemplo");
    await screen.getByRole("textbox", { name: "Notas" }).fill("Tocar timbre");

    // Act
    await screen.getByRole("button", { name: "Guardar pedido" }).click();

    // Assert
    await expect
      .element(
        screen.getByText(
          "Pedido guardado. Queda pendiente de entrega y cobro.",
        ),
      )
      .toBeVisible();
    const { pedidos, detalle } = await saved();
    expect(pedidos).toEqual([
      expect.objectContaining({
        cliente_id: 1,
        fecha_entrega: manana(),
        estado: "pendiente",
        metodo_pago: "transferencia",
        direccion: "https://maps.app.goo.gl/ejemplo",
        notas: "Tocar timbre",
      }),
    ]);
    expect(
      detalle.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
    ).toEqual([
      { producto_id: 1, cantidad: 10 },
      { producto_id: 2, cantidad: 5 },
    ]);
    await expect
      .element(screen.getByRole("status", { name: "Piezas de Fresa" }))
      .toHaveTextContent("0");
    await expect
      .element(screen.getByRole("button", { name: "Guardar pedido" }))
      .toBeDisabled();
  });

  it("keeps what was typed when saving fails", async () => {
    // Arrange
    const { screen, saved } = await openNuevoPedido((base) => ({
      ...base,
      crearPedido: async () => {
        throw new Error("offline");
      },
    }));
    await screen.getByText("Distribuidor Centro · Guadalajara").click();
    await addFive(screen, "Fresa");

    // Act
    await screen.getByRole("button", { name: "Guardar pedido" }).click();

    // Assert
    await expect
      .element(screen.getByText(/No se pudo guardar el pedido/))
      .toBeVisible();
    await expect
      .element(screen.getByRole("status", { name: "Piezas de Fresa" }))
      .toHaveTextContent("5");
    expect((await saved()).pedidos).toEqual([]);
  });
});

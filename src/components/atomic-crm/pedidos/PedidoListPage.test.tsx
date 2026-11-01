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
    nombre: "Boda Ramírez",
    tipo: "evento",
    zona: null,
    telefono: null,
    notas: null,
    activo: true,
  },
];

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
];

// A local date `offset` days from today, as YYYY-MM-DD.
const dia = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const pedido = (id: number, overrides: Partial<Pedido>): Pedido => ({
  id,
  cliente_id: 1,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: dia(1),
  estado: "pendiente",
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
  precio_unitario = 0,
): PedidoDetalle => ({
  id,
  pedido_id,
  producto_id: sabor, // one product per flavor, same id (createCrmDb)
  cantidad,
  precio_unitario,
});

const pedidos = () => [
  pedido(1, { fecha_entrega: dia(1), direccion: "Av. Juárez 100" }),
  pedido(2, { fecha_entrega: dia(0), cliente_id: 2 }),
  pedido(3, { fecha_entrega: dia(-3), notas: "Llamar al llegar" }),
  pedido(4, { fecha_entrega: dia(-1), estado: "entregado" }),
];

const detalle = () => [
  linea(1, 1, 1, 25, 18),
  linea(2, 1, 2, 15, 18),
  linea(3, 2, 2, 40),
  linea(4, 3, 1, 40),
  linea(5, 4, 1, 40),
];

const openOrders = async (path = "/orders") => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path,
    data: {
      cliente: clientes(),
      sabor: sabores(),
      pedido: pedidos(),
      pedido_detalle: detalle(),
    },
    dataProvider: (base) => {
      store = base;
      return base;
    },
  });
  const pedidoGuardado = async (id: number) =>
    (await store!.getOne<Pedido & { piezas: number }>("pedido", { id })).data;
  return { screen, pedidoGuardado };
};

type Screen = Awaited<ReturnType<typeof openOrders>>["screen"];

// The card of an order, found by its client line.
const card = (screen: Screen, cliente: string) =>
  screen
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: cliente })
    .first();

describe("orders screen", () => {
  it("lists pending orders by delivery day, overdue first", async () => {
    // Arrange
    const { screen } = await openOrders("/orders/new");

    // Act
    await screen.getByRole("link", { name: "Ver pedidos" }).click();

    // Assert
    await expect.element(screen.getByText("Hoy")).toBeVisible();
    const headings = screen
      .getByRole("main")
      .getByRole("heading", { level: 2 })
      .elements()
      .map((heading) => heading.textContent);
    const overdueDay = String(Number(dia(-3).slice(-2)));
    // Three days: the delivered order of yesterday is not pending.
    expect(headings).toHaveLength(3);
    expect(headings[0]).toContain(overdueDay);
    expect(headings.slice(1)).toEqual(["Hoy", "Mañana"]);
    await expect
      .element(screen.getByText("Llamar al llegar"))
      .toBeInTheDocument();
  });

  it("shows who, how many of each flavor, how much and where", async () => {
    // Act
    const { screen } = await openOrders();

    // Assert
    const manana = card(screen, "Av. Juárez 100");
    await expect
      .element(manana.getByText("Distribuidor Centro · Guadalajara"))
      .toBeVisible();
    await expect
      .element(manana.getByText("40 piezas · $720 · Efectivo"))
      .toBeVisible();
    await expect.element(manana.getByText("Fresa 25")).toBeVisible();
    await expect.element(manana.getByText("Mango 15")).toBeVisible();
    await expect
      .element(
        card(screen, "Boda Ramírez").getByText(
          "40 piezas · Sin precio · Efectivo",
        ),
      )
      .toBeVisible();
  });

  it("marks an order delivered and lets it be undone", async () => {
    // Arrange
    const { screen, pedidoGuardado } = await openOrders();
    const boda = card(screen, "Boda Ramírez");

    // Act
    await boda.getByRole("button", { name: "Entregado" }).click();
    await expect
      .element(screen.getByText("Pedido marcado como entregado"))
      .toBeVisible();
    await screen.getByRole("button", { name: "Deshacer" }).click();

    // Assert
    await expect
      .element(boda.getByRole("button", { name: "Entregado" }))
      .toBeVisible();
    expect((await pedidoGuardado(2)).estado).toBe("pendiente");
  });

  it("records the delivery when the notice closes", async () => {
    // Arrange
    const { screen, pedidoGuardado } = await openOrders();

    // Act
    await card(screen, "Boda Ramírez")
      .getByRole("button", { name: "Entregado" })
      .click();
    await screen.getByRole("button", { name: /close/i }).click();

    // Assert
    await expect
      .poll(async () => (await pedidoGuardado(2)).estado)
      .toBe("entregado");
    expect((await pedidoGuardado(2)).entregado_en).not.toBeNull();
    await screen.getByText("Entregados").click();
    await expect
      .element(card(screen, "Boda Ramírez").getByText("Entregado"))
      .toBeVisible();
  });

  it("cancels an order, which then shows under Cancelados", async () => {
    // Arrange
    const { screen, pedidoGuardado } = await openOrders();

    // Act
    await card(screen, "Boda Ramírez")
      .getByRole("button", { name: "Cancelar" })
      .click();
    await screen.getByRole("button", { name: /close/i }).click();

    // Assert
    await expect
      .poll(async () => (await pedidoGuardado(2)).estado)
      .toBe("cancelado");
    await screen.getByText("Cancelados").click();
    await expect
      .element(
        card(screen, "Boda Ramírez").getByRole("button", {
          name: "Regresar a pendiente",
        }),
      )
      .toBeVisible();
  });

  it("keeps the chosen filter in the address", async () => {
    // Act
    const { screen } = await openOrders("/orders?estado=entregado");

    // Assert
    await expect
      .element(screen.getByRole("radio", { name: "Entregados" }))
      .toBeChecked();
    await expect.element(screen.getByText("Ayer")).toBeVisible();
    await expect.element(screen.getByText("Hoy")).not.toBeInTheDocument();
  });
});

describe("edit order screen", () => {
  it("opens filled with the order and saves the changes", async () => {
    // Arrange
    const { screen, pedidoGuardado } = await openOrders();
    await card(screen, "Av. Juárez 100")
      .getByRole("link", { name: "Editar" })
      .click();
    await expect
      .element(screen.getByRole("heading", { name: "Editar pedido" }))
      .toBeVisible();
    await expect
      .element(
        screen.getByRole("radio", {
          name: "Distribuidor Centro · Guadalajara",
        }),
      )
      .toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Mañana" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("status", { name: "Piezas de Fresa" }))
      .toHaveTextContent("25");

    // Act
    await screen
      .getByRole("button", { name: "Agregar 5 piezas de Mango" })
      .click();
    await screen.getByRole("button", { name: "Guardar cambios" }).click();

    // Assert
    await expect.element(screen.getByText("Pedido actualizado")).toBeVisible();
    await expect.element(screen.getByText("Mango 20")).toBeVisible();
    const guardado = await pedidoGuardado(1);
    expect(guardado.piezas).toBe(45);
    expect(guardado.direccion).toBe("Av. Juárez 100");
  });

  it("does not edit an order that was already delivered", async () => {
    // Act
    const { screen } = await openOrders("/orders/4/edit");

    // Assert
    await expect
      .element(screen.getByText("Solo se pueden editar pedidos pendientes."))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Guardar cambios" }))
      .not.toBeInTheDocument();
  });
});

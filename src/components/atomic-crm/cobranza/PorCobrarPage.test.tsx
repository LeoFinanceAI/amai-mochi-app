import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pago, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
const cliente = (
  id: number,
  nombre: string,
  telefono: string | null,
): Cliente => ({
  id,
  nombre,
  tipo: "distribuidor",
  zona: id === 1 ? "Guadalajara" : null,
  telefono,
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

const pedido = (
  id: number,
  cliente_id: number,
  diasAtras: number,
  estado: Pedido["estado"] = "entregado",
): Pedido => ({
  id,
  cliente_id,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: dia(-diasAtras),
  estado,
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
});

const linea = (id: number, precio: number): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id: 1,
  cantidad: 40,
  precio_unitario: precio,
});

const openReceivables = async (path = "/receivables") => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path,
    data: {
      cliente: [
        cliente(1, "Tienda Centro", "3312345678"),
        cliente(2, "Café Norte", null),
        cliente(3, "Boda Ramírez", null),
      ],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, 1, 10),
        pedido(2, 1, 2),
        pedido(3, 2, 4),
        pedido(4, 3, 1),
        pedido(5, 2, 0, "pendiente"),
      ],
      pedido_detalle: [
        linea(1, 25),
        linea(2, 20),
        linea(3, 15),
        linea(4, 0),
        linea(5, 25),
      ],
    },
    dataProvider: (base) => {
      store = base;
      return base;
    },
  });
  const pagos = async () =>
    (
      await store!.getList<Pago>("pago", {
        pagination: { page: 1, perPage: 50 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      })
    ).data;
  return { screen, pagos };
};

type Screen = Awaited<ReturnType<typeof openReceivables>>["screen"];

const tarjeta = (screen: Screen, nombre: string) =>
  screen
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: nombre })
    .first();

describe("receivables screen", () => {
  it("shows what each client owes for delivered orders", async () => {
    // Act
    const { screen } = await openReceivables();

    // Assert: 40×25 + 40×20 + 40×15 (+ an order with no price).
    await expect.element(screen.getByText("$2,400")).toBeVisible();
    await expect
      .element(screen.getByText("4 pedidos · 1 con más de 7 días"))
      .toBeVisible();
    const tienda = tarjeta(screen, "Tienda Centro");
    await expect.element(tienda.getByText("$1,800")).toBeVisible();
    await expect.element(tienda.getByText("hace 10 días")).toBeVisible();
    await expect.element(tienda.getByText("hace 2 días")).toBeVisible();
    // The pending order of Café Norte is not owed yet.
    await expect
      .element(tarjeta(screen, "Café Norte").getByText("$600"))
      .toBeVisible();
    const boda = tarjeta(screen, "Boda Ramírez");
    await expect.element(boda.getByText("Sin precio")).toBeVisible();
    await expect
      .element(boda.getByRole("button", { name: "Registrar pago" }))
      .toBeDisabled();
  });

  it("filters the clients with orders older than 7 days", async () => {
    // Arrange
    const { screen } = await openReceivables();

    // Act
    await screen.getByText("Más de 7 días").click();

    // Assert
    await expect.element(screen.getByText("Tienda Centro")).toBeVisible();
    await expect
      .element(screen.getByText("Café Norte"))
      .not.toBeInTheDocument();
  });

  it("opens WhatsApp with the reminder already written", async () => {
    // Act
    const { screen } = await openReceivables();

    // Assert
    const recordar = tarjeta(screen, "Tienda Centro").getByRole("link", {
      name: "Recordar",
    });
    await expect.element(recordar).toBeVisible();
    const url = new URL(recordar.element().getAttribute("href") ?? "");
    expect(url.pathname).toBe("/523312345678");
    expect(url.searchParams.get("text")).toBe(
      "Hola Tienda Centro, te escribo de Amai Mochi. Te recuerdo el pago pendiente de $1,800 por 2 pedidos. ¡Muchas gracias!",
    );
    await expect
      .element(
        tarjeta(screen, "Café Norte").getByText("Sin teléfono para recordar"),
      )
      .toBeVisible();
  });

  it("registers a client's payment and lets it be undone", async () => {
    // Arrange
    const { screen, pagos } = await openReceivables();
    const tienda = tarjeta(screen, "Tienda Centro");

    // Act
    await tienda.getByRole("button", { name: "Registrar pago" }).click();
    await tienda.getByRole("button", { name: "Transferencia" }).click();

    // Assert
    await expect
      .element(screen.getByText("Pago de Tienda Centro registrado"))
      .toBeVisible();
    await expect.element(screen.getByText("$600")).toBeVisible();
    await expect.element(screen.getByText("Cobrado hoy")).toBeVisible();
    expect(
      (await pagos()).map(({ pedido_id, cliente_id, monto, metodo }) => ({
        pedido_id,
        cliente_id,
        monto,
        metodo,
      })),
    ).toEqual([
      { pedido_id: 1, cliente_id: 1, monto: 1000, metodo: "transferencia" },
      { pedido_id: 2, cliente_id: 1, monto: 800, metodo: "transferencia" },
    ]);

    // Act: undo. "Cobrado hoy" sits at the bottom of a phone screen, where
    // the payment notice and the fixed bottom bar cover it: close the notice
    // and bring the button to the middle, as a person would scroll to it.
    await screen.getByRole("button", { name: /close/i }).click();
    const deshacer = screen
      .getByRole("region", { name: "Cobrado hoy" })
      .getByRole("button", { name: "Deshacer" });
    await expect.element(deshacer).toBeEnabled();
    deshacer.element().scrollIntoView({ block: "center" });
    await deshacer.click();

    // Assert
    await expect.element(screen.getByText("$2,400")).toBeVisible();
    await expect.poll(async () => (await pagos()).length).toBe(0);
  });
});

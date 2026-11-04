import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up client: never real customer data in tests.
const clientes = (): Cliente[] => [
  {
    id: 1,
    nombre: "Tienda Centro",
    tipo: "distribuidor",
    zona: null,
    telefono: null,
    notas: null,
    activo: true,
  },
];

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
  { id: 3, nombre: "Taro", color: "#A985D1", activo: true },
];

const dia = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const pedido = (
  id: number,
  fecha_entrega: string,
  estado: Pedido["estado"] = "pendiente",
): Pedido => ({
  id,
  cliente_id: 1,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega,
  estado,
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
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

// Tomorrow: two pending orders (Fresa 25+20, Mango 15) plus a cancelled one
// that must not count. Today: one pending order of Taro.
const openProduction = (path = "/orders/production") =>
  renderMobileApp({
    path,
    data: {
      cliente: clientes(),
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, dia(1)),
        pedido(2, dia(1)),
        pedido(3, dia(1), "cancelado"),
        pedido(4, dia(0)),
      ],
      pedido_detalle: [
        linea(1, 1, 1, 25),
        linea(2, 1, 2, 15),
        linea(3, 2, 1, 20),
        linea(4, 3, 3, 40),
        linea(5, 4, 3, 40),
      ],
    },
  });

const filas = async (screen: Awaited<ReturnType<typeof openProduction>>) => {
  const lista = screen.getByRole("list", { name: "Piezas por sabor" });
  await expect.element(lista).toBeVisible();
  return lista
    .getByRole("listitem")
    .elements()
    .map((item) => item.textContent);
};

describe("production screen", () => {
  it("adds up tomorrow's pending pieces per flavor, most first", async () => {
    // Arrange
    const screen = await openProduction("/orders");

    // Act
    await screen.getByRole("link", { name: "Producción" }).click();

    // Assert
    await expect
      .element(screen.getByRole("radio", { name: "Mañana" }))
      .toBeChecked();
    await expect
      .element(screen.getByText("60 piezas para 2 pedidos"))
      .toBeVisible();
    expect(await filas(screen)).toEqual(["Fresa45", "Mango15"]);
  });

  it("switches to today's orders", async () => {
    // Arrange
    const screen = await openProduction();
    await expect
      .element(screen.getByText("60 piezas para 2 pedidos"))
      .toBeVisible();

    // Act
    await screen.getByText("Hoy", { exact: true }).click();

    // Assert
    await expect
      .element(screen.getByText("40 piezas para 1 pedido"))
      .toBeVisible();
    expect(await filas(screen)).toEqual(["Taro40"]);
  });

  it("says when there is nothing to prepare", async () => {
    // Act
    const screen = await openProduction("/orders/production?dia=pasado");

    // Assert
    await expect
      .element(screen.getByText("No hay pedidos pendientes para ese día."))
      .toBeVisible();
  });
});

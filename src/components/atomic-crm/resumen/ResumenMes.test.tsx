import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import { mesActual } from "../exportar/csv";
import type {
  Cliente,
  Gasto,
  Pago,
  Pedido,
  PedidoDetalle,
  Sabor,
} from "../types";
import { moverMeses } from "./mes";

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
];

const este = mesActual();
const pasado = moverMeses(este, -1);

const pedido = (
  id: number,
  cliente_id: number,
  fecha_entrega: string,
  estado: Pedido["estado"] = "entregado",
): Pedido => ({
  id,
  cliente_id,
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
  producto_id: number,
  cantidad: number,
): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id,
  cantidad,
  precio_unitario: 25,
});

// This month: 40 Fresa to Tienda Centro (paid) on the 1st, 20 Mango to Café
// Norte on the 2nd, a pending order; $300 of expenses. Last month: 40 Fresa.
const openMonth = (path = "/summary?vista=mes") =>
  renderMobileApp({
    path,
    data: {
      cliente: [cliente(1, "Tienda Centro"), cliente(2, "Café Norte")],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, 1, `${este}-01`),
        pedido(2, 2, `${este}-02`),
        pedido(3, 1, `${este}-02`, "pendiente"),
        pedido(4, 2, `${pasado}-15`),
      ],
      pedido_detalle: [
        linea(1, 1, 40),
        linea(2, 2, 20),
        linea(3, 1, 40),
        linea(4, 1, 40),
      ],
      pago: [
        {
          id: 1,
          cliente_id: 1,
          pedido_id: 1,
          fecha: `${este}-01`,
          monto: 1000,
          metodo: "efectivo",
          referencia: null,
          notas: null,
        } satisfies Pago,
      ],
      gasto: [
        {
          id: 1,
          fecha: `${este}-01`,
          categoria: "empaque",
          monto: 300,
          descripcion: null,
        } satisfies Gasto,
      ],
    },
  });

type Screen = Awaited<ReturnType<typeof openMonth>>;

const tarjeta = (screen: Screen, titulo: string) =>
  screen.getByRole("main").getByText(titulo, { exact: true }).element()
    .parentElement?.textContent;

describe("monthly summary", () => {
  it("shows this month's sales, collections, expenses and profit", async () => {
    // Act
    const screen = await openMonth();

    // Assert
    await expect
      .element(screen.getByRole("heading", { name: "Tu mes" }))
      .toBeVisible();
    await expect.element(screen.getByText("$1,500").first()).toBeVisible();
    expect(tarjeta(screen, "Vendiste")).toBe(
      "Vendiste$1,500+50% vs. mes pasado",
    );
    expect(tarjeta(screen, "Cobrado")).toBe("Cobrado$1,000");
    expect(tarjeta(screen, "Por cobrar")).toBe("Por cobrar$500 ›");
    expect(tarjeta(screen, "Gastos")).toBe("Gastos$300");
    expect(tarjeta(screen, "Ganancia")).toBe(
      "Ganancia$1,200Ventas menos gastos",
    );
    await expect
      .element(screen.getByRole("region", { name: "Piezas por día" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Mes siguiente" }))
      .toBeDisabled();
  });

  it("switches from the week to the month and back to last month", async () => {
    // Arrange
    const screen = await openMonth("/summary");
    await expect
      .element(screen.getByRole("heading", { name: "Tu semana" }))
      .toBeVisible();

    // Act
    await screen.getByText("Mes", { exact: true }).click();
    await expect
      .element(screen.getByRole("heading", { name: "Tu mes" }))
      .toBeVisible();
    await screen.getByRole("button", { name: "Mes anterior" }).click();

    // Assert: last month's single delivery, with no month before it.
    await expect.poll(() => tarjeta(screen, "Vendiste")).toBe("Vendiste$1,000");
    expect(tarjeta(screen, "Gastos")).toBe("Gastos$0");
  });
});

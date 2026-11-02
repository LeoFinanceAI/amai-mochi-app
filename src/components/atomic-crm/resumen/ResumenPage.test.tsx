import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import { lunesDeLaSemana } from "../gastos/gastoForm";
import type {
  Cliente,
  Gasto,
  Pago,
  Pedido,
  PedidoDetalle,
  Sabor,
} from "../types";
import { moverSemanas } from "./semana";

// Made-up clients: never real customer data in tests.
const cliente = (id: number, nombre: string, zona: string): Cliente => ({
  id,
  nombre,
  tipo: "distribuidor",
  zona,
  telefono: null,
  notas: null,
  activo: true,
});

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
];

const lunes = lunesDeLaSemana();
const pasado = moverSemanas(lunes, -1);
const dia = (base: string, mas: number) => {
  const [y, m, d] = base.split("-").map(Number);
  return new Date(y, m - 1, d + mas).toLocaleDateString("en-CA");
};

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
  pedido_id: number,
  sabor: number,
  cantidad: number,
): PedidoDetalle => ({
  id,
  pedido_id,
  producto_id: sabor,
  cantidad,
  precio_unitario: 25,
});

// This week: Tuesday 40 (Fresa 30 + Mango 10) to Tienda Centro, paid; Thursday
// 20 Mango to Café Norte, unpaid; a pending order that does not count.
// Last week: 40 Fresa delivered ($1,000).
const openSummary = (path = "/summary") =>
  renderMobileApp({
    path,
    data: {
      cliente: [
        cliente(1, "Tienda Centro", "Guadalajara"),
        cliente(2, "Café Norte", "Colima"),
      ],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, 1, dia(lunes, 1)),
        pedido(2, 2, dia(lunes, 3)),
        pedido(3, 1, dia(lunes, 4), "pendiente"),
        pedido(4, 2, dia(pasado, 2)),
      ],
      pedido_detalle: [
        linea(1, 1, 1, 30),
        linea(2, 1, 2, 10),
        linea(3, 2, 2, 20),
        linea(4, 3, 1, 40),
        linea(5, 4, 1, 40),
      ],
      pago: [
        {
          id: 1,
          cliente_id: 1,
          pedido_id: 1,
          fecha: dia(lunes, 1),
          monto: 1000,
          metodo: "efectivo",
          referencia: null,
          notas: null,
        } satisfies Pago,
      ],
      gasto: [
        {
          id: 1,
          fecha: lunes,
          categoria: "ingredientes",
          monto: 300,
          descripcion: null,
        } satisfies Gasto,
      ],
    },
  });

type Screen = Awaited<ReturnType<typeof openSummary>>;

const tarjeta = (screen: Screen, titulo: string) =>
  screen.getByRole("main").getByText(titulo, { exact: true }).element()
    .parentElement?.textContent;

describe("weekly summary", () => {
  it("shows this week's sales, collections, expenses and profit", async () => {
    // Act
    const screen = await openSummary();

    // Assert
    await expect
      .element(screen.getByRole("heading", { name: "Tu semana" }))
      .toBeVisible();
    await expect.element(screen.getByText("$1,500").first()).toBeVisible();
    expect(tarjeta(screen, "Vendiste")).toBe(
      "Vendiste$1,500+50% vs. semana pasada",
    );
    expect(tarjeta(screen, "Pedidos")).toBe("Pedidos230 pzs en promedio");
    expect(tarjeta(screen, "Cobrado")).toBe("Cobrado$1,000");
    expect(tarjeta(screen, "Por cobrar")).toBe("Por cobrar$500 ›");
    expect(tarjeta(screen, "Gastos")).toBe("Gastos$300");
    expect(tarjeta(screen, "Ganancia")).toBe(
      "Ganancia$1,200Ventas menos gastos",
    );
    await expect
      .element(screen.getByRole("button", { name: "Semana siguiente" }))
      .toBeDisabled();
  });

  it("charts pieces per day, top flavors and sales per client", async () => {
    // Act
    const screen = await openSummary();

    // Assert
    await expect
      .element(screen.getByRole("region", { name: "Por cliente" }))
      .toBeVisible();
    const dias = screen
      .getByRole("region", { name: "Piezas por día" })
      .getByRole("listitem")
      .elements()
      .map((item) => item.getAttribute("aria-label"));
    expect(dias).toHaveLength(7);
    expect(dias[1]).toMatch(/: 40 piezas$/);
    expect(dias[3]).toMatch(/: 20 piezas$/);
    expect(dias[0]).toMatch(/: 0 piezas$/);
    const top = screen
      .getByRole("region", { name: "Sabores más vendidos" })
      .getByRole("listitem")
      .elements()
      .map((item) => item.getAttribute("aria-label"));
    expect(top).toEqual(["Fresa: 30 piezas", "Mango: 30 piezas"]);
    const clientes = screen
      .getByRole("region", { name: "Por cliente" })
      .getByRole("listitem")
      .elements()
      .map((item) => item.textContent);
    expect(clientes).toEqual([
      "Tienda CentroGuadalajara · 40 piezas$1,000",
      "Café NorteColima · 20 piezas$500",
    ]);
  });

  it("goes back to last week", async () => {
    // Arrange
    const screen = await openSummary();
    await expect
      .element(screen.getByRole("region", { name: "Por cliente" }))
      .toBeVisible();

    // Act
    await screen.getByRole("button", { name: "Semana anterior" }).click();

    // Assert: last week's single delivery, with no week before it to compare.
    await expect.poll(() => tarjeta(screen, "Vendiste")).toBe("Vendiste$1,000");
    await expect
      .element(screen.getByRole("button", { name: "Semana siguiente" }))
      .toBeEnabled();
  });

  it("says when a week had no deliveries", async () => {
    // Act
    const screen = await openSummary(
      `/summary?semana=${moverSemanas(lunes, -3)}`,
    );

    // Assert
    await expect
      .element(screen.getByText("No hubo entregas esta semana."))
      .toBeVisible();
    expect(tarjeta(screen, "Vendiste")).toBe("Vendiste$0");
  });
});

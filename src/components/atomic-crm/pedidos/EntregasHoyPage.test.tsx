import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
const cliente = (id: number, nombre: string, zona: string | null): Cliente => ({
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
];

const dia = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const pedido = (id: number, overrides: Partial<Pedido>): Pedido => ({
  id,
  cliente_id: id,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: dia(0),
  estado: "pendiente",
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
  ...overrides,
});

const clientes = () => [
  cliente(1, "Tienda Centro", "Guadalajara"),
  cliente(2, "Café Norte", null),
  cliente(3, "Boda Ramírez", null),
  cliente(4, "Tienda Atrasada", null),
  cliente(5, "Para Mañana", null),
  cliente(6, "Entregado Antes", null),
];

const pedidos = () => [
  pedido(1, { direccion: "Av. Juárez 100" }),
  pedido(2, { estado: "entregado" }),
  pedido(3, { estado: "cancelado" }),
  pedido(4, { fecha_entrega: dia(-2) }),
  pedido(5, { fecha_entrega: dia(1) }),
  pedido(6, { fecha_entrega: dia(-1), estado: "entregado" }),
];

const detalle = (): PedidoDetalle[] =>
  pedidos().map((p) => ({
    id: p.id,
    pedido_id: p.id,
    producto_id: 1,
    cantidad: 40,
    precio_unitario: 0,
  }));

const openDeliveries = (path = "/orders/today", conPedidos = true) =>
  renderMobileApp({
    path,
    data: {
      cliente: clientes(),
      sabor: sabores(),
      pedido: conPedidos ? pedidos() : [],
      pedido_detalle: conPedidos ? detalle() : [],
    },
  });

type Screen = Awaited<ReturnType<typeof openDeliveries>>;

const clientesEn = (screen: Screen, seccion: string) =>
  screen
    .getByRole("region", { name: seccion })
    .getByRole("listitem")
    .elements()
    .filter((item) => item.querySelector("button, a"))
    .map((item) => item.querySelector("span")?.textContent);

describe("today's deliveries", () => {
  it("lists today's orders, pending first, and the overdue ones", async () => {
    // Arrange
    const screen = await openDeliveries("/orders");

    // Act
    await screen.getByRole("link", { name: "Entregas de hoy" }).click();

    // Assert
    await expect
      .element(screen.getByText("1 de 2 entregados · faltan 40 piezas"))
      .toBeVisible();
    expect(clientesEn(screen, "Hoy")).toEqual([
      "Tienda Centro · Guadalajara",
      "Café Norte",
    ]);
    expect(clientesEn(screen, "Atrasados")).toEqual(["Tienda Atrasada"]);
    for (const otro of ["Boda Ramírez", "Para Mañana", "Entregado Antes"]) {
      await expect.element(screen.getByText(otro)).not.toBeInTheDocument();
    }
  });

  it("opens the delivery address in Maps", async () => {
    // Act
    const screen = await openDeliveries();

    // Assert
    const link = screen.getByRole("link", {
      name: "Abrir Av. Juárez 100 en Maps",
    });
    await expect.element(link).toHaveAttribute("target", "_blank");
    const href = new URL(link.element().getAttribute("href") ?? "");
    expect(href.searchParams.get("query")).toBe("Av. Juárez 100, Guadalajara");
  });

  it("counts an order as delivered once it is marked", async () => {
    // Arrange
    const screen = await openDeliveries();

    // Act
    await screen
      .getByRole("region", { name: "Hoy" })
      .getByRole("button", { name: "Entregado" })
      .click();
    await screen.getByRole("button", { name: /close/i }).click();

    // Assert
    await expect
      .element(screen.getByText("2 de 2 entregados · faltan 0 piezas"))
      .toBeVisible();
  });

  it("says when there is nothing to deliver today", async () => {
    // Act
    const screen = await openDeliveries("/orders/today", false);

    // Assert
    await expect
      .element(screen.getByText("No hay entregas para hoy."))
      .toBeVisible();
  });
});

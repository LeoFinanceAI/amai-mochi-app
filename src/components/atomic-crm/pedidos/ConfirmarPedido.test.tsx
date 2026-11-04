import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients and phone: never real customer data in tests.
const cliente = (
  id: number,
  nombre: string,
  telefono: string | null,
): Cliente => ({
  id,
  nombre,
  tipo: "distribuidor",
  zona: null,
  telefono,
  notas: null,
  activo: true,
});

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
];

// A fixed future date, so the formatted day does not depend on today.
const ENTREGA = "2030-01-15"; // martes

const pedido = (
  id: number,
  cliente_id: number,
  estado: Pedido["estado"] = "pendiente",
): Pedido => ({
  id,
  cliente_id,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: ENTREGA,
  estado,
  metodo_pago: "transferencia",
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

const openOrders = (path = "/orders") =>
  renderMobileApp({
    path,
    data: {
      cliente: [
        cliente(1, "Tienda Centro", "3312345678"),
        cliente(2, "Café Norte", null),
      ],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [pedido(1, 1), pedido(2, 2), pedido(3, 1, "entregado")],
      pedido_detalle: [
        linea(1, 1, 1, 25),
        linea(2, 1, 2, 15),
        linea(3, 2, 1, 40),
        linea(4, 3, 1, 40),
      ],
    },
  });

type Screen = Awaited<ReturnType<typeof openOrders>>;

const tarjeta = (screen: Screen, nombre: string) =>
  screen
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: nombre })
    .first();

describe("confirm an order on WhatsApp", () => {
  it("opens WhatsApp with the order summary already written", async () => {
    // Act
    const screen = await openOrders();

    // Assert
    const confirmar = tarjeta(screen, "Tienda Centro").getByRole("link", {
      name: "Confirmar por WhatsApp",
    });
    await expect.element(confirmar).toHaveAttribute("target", "_blank");
    const url = new URL(confirmar.element().getAttribute("href") ?? "");
    expect(url.pathname).toBe("/523312345678");
    expect(url.searchParams.get("text")).toBe(
      [
        "Hola Tienda Centro, te confirmo tu pedido de Amai Mochi:",
        "• Fresa: 25",
        "• Mango: 15",
        "Total: 40 piezas · $1,200",
        "Entrega: martes 15 de ene",
        "Pago al recibir: transferencia",
        "¡Gracias!",
      ].join("\n"),
    );
  });

  it("is not offered without a phone, nor for delivered orders", async () => {
    // Act
    const screen = await openOrders("/orders?estado=todos");

    // Assert
    await expect
      .element(
        tarjeta(screen, "Tienda Centro").getByRole("link", {
          name: "Confirmar por WhatsApp",
        }),
      )
      .toBeVisible();
    const links = screen
      .getByRole("main")
      .getByRole("link", { name: "Confirmar por WhatsApp" })
      .elements();
    expect(links).toHaveLength(1); // only the pending order with a phone
  });
});

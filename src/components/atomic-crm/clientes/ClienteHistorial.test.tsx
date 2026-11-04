import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pago, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
const cliente = (id: number, nombre: string): Cliente => ({
  id,
  nombre,
  tipo: "distribuidor",
  zona: "Guadalajara",
  telefono: null,
  notas: null,
  activo: true,
});

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
];

const pedido = (
  id: number,
  fecha_entrega: string,
  estado: Pedido["estado"],
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

const linea = (id: number, cantidad: number): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id: 1,
  cantidad,
  precio_unitario: 25,
});

// Tienda Centro: two delivered orders ($1,000 + $500), $1,000 paid, one
// pending order and one cancelled order (not counted).
const openClient = (id: number) =>
  renderMobileApp({
    path: `/cliente/${id}`,
    data: {
      cliente: [cliente(1, "Tienda Centro"), cliente(2, "Café Norte")],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, "2026-10-20", "entregado"),
        pedido(2, "2026-10-27", "entregado"),
        pedido(3, "2026-11-03", "cancelado"),
        pedido(4, "2026-11-06", "pendiente"),
      ],
      pedido_detalle: [linea(1, 40), linea(2, 20), linea(3, 40), linea(4, 80)],
      pago: [
        {
          id: 1,
          cliente_id: 1,
          pedido_id: 1,
          fecha: "2026-10-20",
          monto: 1000,
          metodo: "efectivo",
          referencia: null,
          notas: null,
        } satisfies Pago,
      ],
    },
  });

type Screen = Awaited<ReturnType<typeof openClient>>;
type Region = ReturnType<Screen["getByRole"]>;

// The text of one of the three cards (title + value).
const dato = (historial: Region, titulo: string) =>
  historial.getByText(titulo, { exact: true }).element().parentElement
    ?.textContent;

describe("client history", () => {
  it("shows what the client bought, owes and their latest orders", async () => {
    // Act
    const screen = await openClient(1);

    // Assert
    const historial = screen.getByRole("region", {
      name: "Historial del cliente",
    });
    await expect.element(historial).toBeVisible();
    expect(dato(historial, "Ha comprado")).toBe("Ha comprado$1,500");
    expect(dato(historial, "Pedidos")).toBe("Pedidos3");
    expect(dato(historial, "Debe")).toBe("Debe$500");
    const pedidos = historial
      .getByRole("listitem")
      .elements()
      .map((item) => item.textContent);
    expect(pedidos).toHaveLength(3);
    expect(pedidos[0]).toMatch(/6 nov.*Fresa 80.*\$2,000.*Pendiente/i);
    expect(pedidos[2]).toMatch(/20 oct.*Fresa 40.*\$1,000.*Entregado/i);
    await expect
      .element(screen.getByRole("textbox", { name: /nombre/i }))
      .toHaveValue("Tienda Centro");
  });

  it("says when a client has no orders yet", async () => {
    // Act
    const screen = await openClient(2);

    // Assert
    await expect
      .element(screen.getByText("Todavía no tiene pedidos."))
      .toBeVisible();
    await expect.element(screen.getByText("$0").first()).toBeVisible();
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
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
];

const dia = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const pedido = (id: number, cliente_id: number, diasAtras: number): Pedido => ({
  id,
  cliente_id,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega: dia(-diasAtras),
  estado: "entregado",
  metodo_pago: "efectivo",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
});

const linea = (id: number): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id: 1,
  cantidad: 40,
  precio_unitario: 25,
});

// Overdue with a phone: Tienda Centro (12 days) and Café Norte (9 days).
// Overdue with no phone: Boda Ramírez. Recent: Dulcería Sur (2 days).
const openReceivables = () =>
  renderMobileApp({
    path: "/receivables",
    data: {
      cliente: [
        cliente(1, "Tienda Centro", "3312345678"),
        cliente(2, "Café Norte", "3123456789"),
        cliente(3, "Boda Ramírez", null),
        cliente(4, "Dulcería Sur", "3399999999"),
      ],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, 1, 12),
        pedido(2, 2, 9),
        pedido(3, 3, 20),
        pedido(4, 4, 2),
      ],
      pedido_detalle: [linea(1), linea(2), linea(3), linea(4)],
    },
  });

// Keeps WhatsApp links from opening a tab; records where they pointed.
const abiertos: string[] = [];
const interceptar = (event: MouseEvent) => {
  const link = (event.target as Element).closest("a[href^='https://wa.me']");
  if (!(link instanceof HTMLAnchorElement)) return;
  event.preventDefault();
  abiertos.push(link.href);
};

afterEach(() => {
  document.removeEventListener("click", interceptar, true);
  abiertos.length = 0;
});

describe("remind every overdue client", () => {
  it("goes through the overdue clients with a phone, one chat at a time", async () => {
    // Arrange
    document.addEventListener("click", interceptar, true);
    const screen = await openReceivables();

    // Act
    await screen
      .getByRole("button", {
        name: "Recordar a los 2 clientes con pedidos de más de 7 días",
      })
      .click();
    const ronda = screen.getByRole("region", { name: "Recordatorios" });
    await expect.element(ronda.getByText("Recordatorio 1 de 2")).toBeVisible();
    await ronda.getByRole("link", { name: "Enviar a Tienda Centro" }).click();
    await expect.element(ronda.getByText("Recordatorio 2 de 2")).toBeVisible();
    await ronda.getByRole("button", { name: "Saltar" }).click();

    // Assert
    await expect
      .element(ronda.getByText("Listo: mandaste 1 de 2 recordatorios."))
      .toBeVisible();
    expect(abiertos).toHaveLength(1);
    const url = new URL(abiertos[0]);
    expect(url.pathname).toBe("/523312345678");
    expect(url.searchParams.get("text")).toBe(
      "Hola Tienda Centro, te escribo de Amai Mochi. Te recuerdo el pago pendiente de $1,000 por 1 pedido. ¡Muchas gracias!",
    );
  });

  it("ends the round early and hides it again on close", async () => {
    // Arrange
    const screen = await openReceivables();
    const iniciar = screen.getByRole("button", {
      name: /Recordar a los 2 clientes/,
    });
    await iniciar.click();

    // Act
    await screen.getByRole("button", { name: "Terminar" }).click();
    await screen.getByRole("button", { name: "Cerrar" }).click();

    // Assert
    await expect.element(iniciar).toBeVisible();
    await expect
      .element(screen.getByRole("region", { name: "Recordatorios" }))
      .not.toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pedido, PedidoDetalle, Sabor } from "../types";

// Made-up clients: never real customer data in tests.
const cliente = (
  id: number,
  nombre: string,
  tipo: Cliente["tipo"],
  telefono: string | null = null,
  activo = true,
): Cliente => ({
  id,
  nombre,
  tipo,
  zona: id === 1 ? "Guadalajara" : null,
  telefono,
  notas: null,
  activo,
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

const linea = (id: number, cantidad: number): PedidoDetalle => ({
  id,
  pedido_id: id,
  producto_id: 1,
  cantidad,
  precio_unitario: 25,
});

// Tienda Centro buys most ($2,000 in 90 days); Café Norte $1,000 but last
// ordered 45 days ago (a cancelled order 2 days ago does not count); Antigua
// tienda is inactive; Público en general is left out; Dulcería Sur ordered
// 120 days ago, outside the 90 days, and has no phone.
const openCustomers = () =>
  renderMobileApp({
    path: "/customers",
    data: {
      cliente: [
        cliente(1, "Tienda Centro", "distribuidor", "3312345678"),
        cliente(2, "Café Norte", "distribuidor", "3123456789"),
        cliente(3, "Antigua tienda", "distribuidor", null, false),
        cliente(4, "Público en general", "publico"),
        cliente(5, "Dulcería Sur", "distribuidor"),
      ],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, 1, 3),
        pedido(2, 1, 10),
        pedido(3, 2, 45),
        pedido(4, 2, 2, "cancelado"),
        pedido(5, 3, 60),
        pedido(6, 4, 1),
        pedido(7, 5, 120),
      ],
      pedido_detalle: [
        linea(1, 40),
        linea(2, 40),
        linea(3, 40),
        linea(4, 40),
        linea(5, 40),
        linea(6, 400),
        linea(7, 40),
      ],
    },
  });

const filas = (
  screen: Awaited<ReturnType<typeof openCustomers>>,
  region: string,
) =>
  screen
    .getByRole("region", { name: region })
    .getByRole("listitem")
    .elements()
    .map((item) => item.textContent);

describe("your clients", () => {
  it("ranks who buys the most in the last 90 days", async () => {
    // Act
    const screen = await openCustomers();

    // Assert
    const region = "Los que más compran (90 días)";
    await expect
      .element(screen.getByRole("region", { name: region }).getByText("$2,000"))
      .toBeVisible();
    expect(filas(screen, region)).toEqual([
      "1Tienda CentroGuadalajara · último pedido hace 3 días$2,000",
      "2Café Norteúltimo pedido hace 45 días$1,000",
      "3Antigua tiendaúltimo pedido hace 60 días$1,000",
    ]);
  });

  it("lists the active distributors who stopped ordering, with WhatsApp", async () => {
    // Act
    const screen = await openCustomers();

    // Assert
    const region = "Sin pedir hace más de 30 días";
    const lista = screen.getByRole("region", { name: region });
    await expect.element(lista.getByText("Café Norte")).toBeVisible();
    expect(filas(screen, region)).toEqual([
      "Dulcería Surúltimo pedido hace 120 díasSin teléfono",
      "Café Norteúltimo pedido hace 45 díasEscribir",
    ]);
    const escribir = lista.getByRole("link", { name: "Escribir" });
    const url = new URL(escribir.element().getAttribute("href") ?? "");
    expect(url.pathname).toBe("/523123456789");
    expect(url.searchParams.get("text")).toBe(
      "Hola Café Norte, te escribo de Amai Mochi. ¿Cómo estás? ¿Te preparo mochis para esta semana?",
    );
  });
});

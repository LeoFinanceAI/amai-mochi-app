import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Pago, PedidoLista, Producto, Sabor } from "../types";

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
];

// Made-up clients: never real customer data in tests.
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

const conPrecio = (precio: number): Producto[] =>
  generateProductos(sabores()).map((p) => ({ ...p, precio_lista: precio }));

const openQuickSale = async (productos = conPrecio(30)) => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path: "/orders/quick-sale",
    data: {
      cliente: clientes(),
      sabor: sabores(),
      producto: productos,
    },
    dataProvider: (base) => {
      store = base;
      return base;
    },
  });
  const all = {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "id", order: "ASC" as const },
    filter: {},
  };
  const leer = async () => ({
    pedidos: (await store!.getList<PedidoLista>("pedido", all)).data,
    pagos: (await store!.getList<Pago>("pago", all)).data,
    clientes: (await store!.getList<Cliente>("cliente", all)).data,
  });
  return { screen, leer };
};

describe("quick sale", () => {
  it("saves a sale to the public as delivered and paid", async () => {
    // Arrange
    const { screen, leer } = await openQuickSale();
    await expect
      .element(screen.getByRole("radio", { name: "Público en general" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Tienda Centro" }))
      .not.toBeInTheDocument();

    // Act: 3 Fresa and 1 Mango, paid by transfer.
    const fresa = screen.getByRole("button", {
      name: "Agregar 1 pieza de Fresa",
    });
    await fresa.click();
    await fresa.click();
    await fresa.click();
    await screen
      .getByRole("button", { name: "Agregar 1 pieza de Mango" })
      .click();
    await screen.getByText("Transferencia").click();
    await screen.getByRole("button", { name: "Cobrar y guardar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Venta de 4 piezas guardada"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Cobrar y guardar" }))
      .toBeDisabled();
    const { pedidos, pagos, clientes } = await leer();
    const publico = clientes.find((c) => c.nombre === "Público en general");
    expect(publico?.tipo).toBe("publico");
    expect(
      pedidos.map(({ cliente_id, estado, piezas, total }) => ({
        cliente_id,
        estado,
        piezas,
        total,
      })),
    ).toEqual([
      { cliente_id: publico?.id, estado: "entregado", piezas: 4, total: 120 },
    ]);
    expect(
      pagos.map(({ pedido_id, monto, metodo }) => ({
        pedido_id,
        monto,
        metodo,
      })),
    ).toEqual([
      { pedido_id: pedidos[0].id, monto: 120, metodo: "transferencia" },
    ]);
  });

  it("can be charged to an event client, with no minimum warning", async () => {
    // Arrange
    const { screen, leer } = await openQuickSale();

    // Act
    await screen.getByText("Boda Ramírez").click();
    await screen
      .getByRole("button", { name: "Agregar 1 pieza de Mango" })
      .click();
    await screen.getByRole("button", { name: "Cobrar y guardar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Venta de 1 pieza guardada"))
      .toBeVisible();
    expect(
      screen.getByText(/para el mínimo|Cumple el mínimo/).elements(),
    ).toHaveLength(0);
    const { pedidos, pagos } = await leer();
    expect(pedidos.map((p) => p.cliente_id)).toEqual([2]);
    expect(pagos.map((p) => p.monto)).toEqual([30]);
  });

  it("leaves a sale with no price unpaid, to collect later", async () => {
    // Arrange
    const { screen, leer } = await openQuickSale(conPrecio(0));

    // Act
    await screen
      .getByRole("button", { name: "Agregar 1 pieza de Fresa" })
      .click();
    await screen.getByRole("button", { name: "Cobrar y guardar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Venta de 1 pieza guardada"))
      .toBeVisible();
    const { pedidos, pagos } = await leer();
    expect(pedidos.map((p) => p.estado)).toEqual(["entregado"]);
    expect(pagos).toEqual([]);
  });
});

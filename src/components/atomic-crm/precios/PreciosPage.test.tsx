import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type { Cliente, Producto, Sabor } from "../types";

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
  { id: 3, nombre: "Matcha", color: "#8A9A3E", activo: false },
];

// Fresa already has a price; the others are still at 0.
const productos = (): Producto[] =>
  generateProductos(sabores()).map((p) =>
    p.sabor_id === 1 ? { ...p, precio_lista: 25 } : p,
  );

// Made-up client: never real customer data in tests.
const clientes = (): Cliente[] => [
  {
    id: 1,
    nombre: "Distribuidor Centro",
    tipo: "distribuidor",
    zona: null,
    telefono: null,
    notas: null,
    activo: true,
  },
];

const openPrices = async (
  dataProvider?: (base: DataProvider) => DataProvider,
) => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path: "/prices",
    data: { sabor: sabores(), producto: productos(), cliente: clientes() },
    dataProvider: (base) => {
      store = base;
      return dataProvider ? (dataProvider(base) as typeof base) : base;
    },
  });
  const precioGuardado = async (id: number) =>
    (await store!.getOne<Producto>("producto", { id })).data.precio_lista;
  return { screen, precioGuardado };
};

describe("prices screen", () => {
  it("shows the current price of each active flavor", async () => {
    // Act
    const { screen } = await openPrices();

    // Assert
    await expect
      .element(screen.getByRole("textbox", { name: "Fresa" }))
      .toHaveValue("25");
    await expect
      .element(screen.getByRole("textbox", { name: "Mango" }))
      .toHaveValue("0");
    await expect.element(screen.getByText("Matcha")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Guardar precios" }))
      .toBeDisabled();
  });

  it("saves a changed price, written with a comma or a dot", async () => {
    // Arrange
    const { screen, precioGuardado } = await openPrices();

    // Act
    await screen.getByRole("textbox", { name: "Mango" }).fill("27,50");
    await screen.getByRole("button", { name: "Guardar precios" }).click();

    // Assert
    await expect.element(screen.getByText("Precios guardados")).toBeVisible();
    expect(await precioGuardado(2)).toBe(27.5);
    expect(await precioGuardado(1)).toBe(25);
  });

  it("applies the same price to every flavor", async () => {
    // Arrange
    const { screen, precioGuardado } = await openPrices();

    // Act
    await screen
      .getByRole("textbox", { name: "Mismo precio para todos" })
      .fill("30");
    await screen.getByRole("button", { name: "Aplicar a todos" }).click();
    await screen.getByRole("button", { name: "Guardar precios" }).click();

    // Assert
    await expect.element(screen.getByText("Precios guardados")).toBeVisible();
    expect([await precioGuardado(1), await precioGuardado(2)]).toEqual([
      30, 30,
    ]);
  });

  it("does not save while a price is not a number", async () => {
    // Arrange
    const { screen, precioGuardado } = await openPrices();

    // Act
    await screen.getByRole("textbox", { name: "Fresa" }).fill("veinte");

    // Assert
    await expect
      .element(screen.getByText(/Escribe cada precio como número/))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Guardar precios" }))
      .toBeDisabled();
    expect(await precioGuardado(1)).toBe(25);
  });

  it("tells when prices could not be saved", async () => {
    // Arrange
    const { screen } = await openPrices((base) => ({
      ...base,
      update: async () => {
        throw new Error("offline");
      },
    }));

    // Act
    await screen.getByRole("textbox", { name: "Mango" }).fill("20");
    await screen.getByRole("button", { name: "Guardar precios" }).click();

    // Assert
    await expect
      .element(screen.getByText(/Algunos precios no se guardaron/))
      .toBeVisible();
  });

  it("prices new orders with the saved price", async () => {
    // Arrange
    const { screen } = await openPrices();
    await screen.getByRole("textbox", { name: "Fresa" }).fill("30");
    await screen.getByRole("button", { name: "Guardar precios" }).click();
    await expect.element(screen.getByText("Precios guardados")).toBeVisible();

    // Act: an order of 40 Fresa.
    await screen.getByRole("link", { name: "Nuevo pedido" }).click();
    await screen.getByText("Distribuidor Centro").click();
    for (let i = 0; i < 8; i++) {
      await screen
        .getByRole("button", { name: "Agregar 5 piezas de Fresa" })
        .click();
    }
    await screen.getByRole("button", { name: "Guardar pedido" }).click();
    await screen.getByRole("link", { name: "Ver pedidos" }).click();

    // Assert
    await expect
      .element(screen.getByText("40 piezas · $1,200 · Efectivo"))
      .toBeVisible();
  });
});

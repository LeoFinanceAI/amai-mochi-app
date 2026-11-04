import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const signInToOrders = async (page: Page) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("john@doe.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "View orders" }).click();
};

test.describe("searching and fixing orders", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("searches pending orders by client name", async ({ page, amai }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    for (const nombre of ["Tienda Centro", "Café Norte", "Tienda Sur"]) {
      const cliente = await amai.createCliente(nombre);
      await amai.createPedido(cliente.id, day(1), [
        { saborId: fresa.id, cantidad: 40 },
      ]);
    }
    await signInToOrders(page);
    await expect(page.getByText("Café Norte")).toBeVisible();

    // Act
    await page
      .getByRole("searchbox", { name: "Search by client" })
      .fill("tienda");

    // Assert
    await expect(page.getByText("Café Norte")).toHaveCount(0);
    await expect(page.getByText("Tienda Centro")).toBeVisible();
    await expect(page.getByText("Tienda Sur")).toBeVisible();
  });

  test("cancels a paid delivered order and removes its payment", async ({
    page,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 25);
    const cliente = await amai.createCliente("Tienda Centro");
    const pedido = await amai.createPedido(cliente.id, day(-1), [
      { saborId: fresa.id, cantidad: 40 },
    ]);
    await amai.marcarEntregado(pedido.id);
    await amai.createPago(cliente.id, pedido.id, day(-1), 1000);
    await signInToOrders(page);
    await page
      .locator("label")
      .filter({ hasText: /^Delivered$/ })
      .click();

    // Act
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Yes, remove the payment" }).click();

    // Assert
    await expect(page.getByText("Order cancelled")).toBeVisible();
    expect(await amai.listPagos()).toEqual([]);
    expect(await amai.listPedidos()).toEqual([
      expect.objectContaining({ estado: "cancelado" }),
    ]);
  });
});

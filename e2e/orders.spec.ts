import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.

// Tomorrow as YYYY-MM-DD in the browser's local time zone.
const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString("en-CA");
};

test.describe("orders", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  const signInToOrders = async (page: Page) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("link", { name: "View orders" }).click();
  };

  test("marks a pending order as delivered", async ({
    page,
    amai,
    dismissToast,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    const cliente = await amai.createCliente("Distribuidor Centro");
    await amai.createPedido(cliente.id, tomorrow(), [
      { saborId: fresa.id, cantidad: 40 },
    ]);
    await signInToOrders(page);
    await expect(page.getByText("Fresa 40")).toBeVisible();

    // Act
    await page.getByRole("button", { name: "Delivered" }).click();
    await dismissToast("Order marked as delivered");

    // Assert
    await expect
      .poll(() => amai.listPedidos())
      .toEqual([
        expect.objectContaining({
          estado: "entregado",
          entregado_en: expect.any(String),
        }),
      ]);
  });

  test("edits a pending order, re-priced by the wholesale tier in SQL", async ({
    page,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    const cliente = await amai.createCliente("Distribuidor Centro");
    await amai.createPrecio(fresa.id, 40, 18);
    await amai.createPedido(cliente.id, tomorrow(), [
      { saborId: fresa.id, cantidad: 35 },
    ]);
    await signInToOrders(page);

    // Act
    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Add 5 pieces of Fresa" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Assert
    await expect(page.getByText("Order updated")).toBeVisible();
    await expect(page.getByText("40 pieces · $720")).toBeVisible();
    await expect
      .poll(() => amai.listPedidos())
      .toEqual([
        expect.objectContaining({
          estado: "pendiente",
          piezas: 40,
          total: 720,
        }),
      ]);
  });
});

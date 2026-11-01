import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.

// A date `offset` days from today as YYYY-MM-DD, in local time.
const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};
const tomorrow = () => day(1);

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

  test("shows today's deliveries with a Maps link", async ({
    page,
    amai,
    dismissToast,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    const cliente = await amai.createCliente("Tienda Centro", "Guadalajara");
    await amai.createPedido(
      cliente.id,
      day(0),
      [{ saborId: fresa.id, cantidad: 40 }],
      "Av. Juárez 100",
    );
    await signInToOrders(page);

    // Act
    await page.getByRole("link", { name: "Today's deliveries" }).click();

    // Assert
    await expect(
      page.getByText("0 of 1 delivered · 40 pieces to go"),
    ).toBeVisible();
    const maps = page.getByRole("link", {
      name: "Open Av. Juárez 100 in Maps",
    });
    const href = new URL((await maps.getAttribute("href")) ?? "");
    expect(href.searchParams.get("query")).toBe("Av. Juárez 100, Guadalajara");
    await page.getByRole("button", { name: "Delivered" }).click();
    await dismissToast("Order marked as delivered");
    await expect(
      page.getByText("1 of 1 delivered · 0 pieces to go"),
    ).toBeVisible();
  });
});

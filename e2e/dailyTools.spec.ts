import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
};

const signIn = async (page: Page) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("john@doe.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test.describe("daily tools", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("production adds up tomorrow's pending pieces per flavor", async ({
    page,
    amai,
  }) => {
    // Arrange: two pending orders tomorrow, one delivered (not counted).
    const fresa = await amai.createSabor("Fresa");
    const mango = await amai.createSabor("Mango", "#F3C443");
    const cliente = await amai.createCliente("Tienda Centro");
    await amai.createPedido(cliente.id, day(1), [
      { saborId: fresa.id, cantidad: 25 },
      { saborId: mango.id, cantidad: 15 },
    ]);
    await amai.createPedido(cliente.id, day(1), [
      { saborId: fresa.id, cantidad: 20 },
    ]);
    const entregado = await amai.createPedido(cliente.id, day(1), [
      { saborId: mango.id, cantidad: 40 },
    ]);
    await amai.marcarEntregado(entregado.id);

    // Act
    await signIn(page);
    await page.getByRole("link", { name: "View orders" }).click();
    await page.getByRole("link", { name: "Production" }).click();

    // Assert
    await expect(page.getByText("60 pieces for 2 orders")).toBeVisible();
    const filas = page
      .getByRole("list", { name: "Pieces per flavor" })
      .getByRole("listitem");
    await expect(filas).toHaveText(["Fresa45", "Mango15"]);
  });

  test("a new order can repeat the client's last one", async ({
    page,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    const cliente = await amai.createCliente("Tienda Centro");
    const anterior = await amai.createPedido(cliente.id, day(-3), [
      { saborId: fresa.id, cantidad: 35 },
    ]);
    await amai.marcarEntregado(anterior.id);

    // Act
    await signIn(page);
    await page.getByText("Tienda Centro").click();
    await page.getByRole("button", { name: "Repeat last order" }).click();

    // Assert
    await expect(
      page.getByRole("status", { name: "Pieces of Fresa" }),
    ).toHaveText("35");
  });
});

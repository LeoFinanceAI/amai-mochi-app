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

test.describe("quick sale and your clients", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("a quick sale is saved delivered and paid by SQL", async ({
    page,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 30);
    await signIn(page);
    await page.getByRole("link", { name: "Quick sale" }).click();

    // Act
    const add = page.getByRole("button", { name: "Add 1 piece of Fresa" });
    await add.click();
    await add.click();
    await page.getByRole("button", { name: "Charge and save" }).click();

    // Assert
    await expect(page.getByText("Sale of 2 pieces saved")).toBeVisible();
    expect(await amai.listPedidos()).toEqual([
      expect.objectContaining({ estado: "entregado", piezas: 2, total: 60 }),
    ]);
    expect(await amai.listPagos()).toEqual([
      expect.objectContaining({ monto: 60, metodo: "efectivo" }),
    ]);
  });

  test("a quick sale can be undone", async ({ page, amai }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 30);
    await signIn(page);
    await page.getByRole("link", { name: "Quick sale" }).click();
    await page.getByRole("button", { name: "Add 1 piece of Fresa" }).click();
    await page.getByRole("button", { name: "Charge and save" }).click();
    const recent = page.getByRole("region", { name: "Sold just now" });
    await expect(recent.getByText("1 piece · $30")).toBeVisible();

    // Act
    await recent.getByRole("button", { name: "Undo" }).click();

    // Assert
    await expect(page.getByText("Sale undone")).toBeVisible();
    expect(await amai.listPagos()).toEqual([]);
    expect(await amai.listPedidos()).toEqual([
      expect.objectContaining({ estado: "cancelado", total: 30 }),
    ]);
  });

  test("your clients shows who buys and who stopped ordering", async ({
    page,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 30);
    const cafe = await amai.createCliente("Café Norte");
    const pedido = await amai.createPedido(cafe.id, day(-45), [
      { saborId: fresa.id, cantidad: 40 },
    ]);
    await amai.marcarEntregado(pedido.id);
    await signIn(page);

    // Act
    await page.getByRole("link", { name: "Summary" }).click();
    await page.getByRole("link", { name: "See your clients" }).click();

    // Assert: days are counted with Mexico's date, which can be a day behind.
    const top = page.getByRole("region", {
      name: "Who buys the most (90 days)",
    });
    await expect(top.getByText("$1,200")).toBeVisible();
    const quiet = page.getByRole("region", {
      name: "No order in more than 30 days",
    });
    await expect(quiet.getByText("Café Norte")).toBeVisible();
    await expect(quiet.getByText(/last order 4[45] days ago/)).toBeVisible();
  });
});

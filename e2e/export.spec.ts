import { readFile } from "node:fs/promises";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.
test.describe("client history and export", () => {
  test.beforeEach(async ({ createSales, amai }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
    // October 2026: a delivered order of $1,000 with $600 paid, and an
    // expense; a November expense that the October file must leave out.
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 25);
    const cliente = await amai.createCliente("Tienda Centro", "Guadalajara");
    const pedido = await amai.createPedido(cliente.id, "2026-10-20", [
      { saborId: fresa.id, cantidad: 40 },
    ]);
    await amai.marcarEntregado(pedido.id);
    await amai.createPago(cliente.id, pedido.id, "2026-10-21", 600);
    await amai.createGasto("2026-10-05", 300);
    await amai.createGasto("2026-11-02", 99);
  });

  const signIn = async (page: Page) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("link", { name: "New order" }).first(),
    ).toBeVisible();
  };

  test("shows what a client bought and owes", async ({ page }) => {
    // Arrange
    await signIn(page);

    // Act
    await page.goto("/cliente");
    await page.getByRole("link", { name: /Tienda Centro/ }).click();

    // Assert
    const historial = page.getByRole("region", { name: "Client history" });
    await expect(historial.getByText("$1,000").first()).toBeVisible();
    await expect(historial.getByText("$400")).toBeVisible();
    await expect(historial.getByText("Fresa 40")).toBeVisible();
  });

  test("downloads a month's expenses as a CSV file", async ({ page }) => {
    // Arrange
    await signIn(page);
    await page.goto("/export");
    await page.getByLabel("Month").fill("2026-10");

    // Act
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Expenses" }).click();

    // Assert
    const file = await download;
    expect(file.suggestedFilename()).toBe("gastos-2026-10.csv");
    const csv = await readFile(await file.path(), "utf8");
    expect(csv).toBe(
      '﻿"Date","Category","Note","Amount"\r\n"2026-10-05","Ingredients",,300\r\n',
    );
  });

  test("downloads a month's payments with the client's name", async ({
    page,
  }) => {
    // Arrange
    await signIn(page);
    await page.goto("/export");
    await page.getByLabel("Month").fill("2026-10");

    // Act
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Payments received" }).click();

    // Assert
    const csv = await readFile(await (await download).path(), "utf8");
    expect(csv).toContain('"2026-10-21","Tienda Centro",');
    expect(csv).toContain('"Cash",,600\r\n');
  });
});

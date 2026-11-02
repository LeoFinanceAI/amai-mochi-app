import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.
test.describe("prices", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("a list price saved on the screen prices new orders in SQL", async ({
    page,
    isMobile,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    const cliente = await amai.createCliente("Distribuidor Centro");
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    if (isMobile) {
      await page.getByRole("link", { name: "Settings" }).click();
    }
    await page.getByRole("link", { name: "Prices" }).click();

    // Act
    await page.getByRole("textbox", { name: "Fresa" }).fill("25");
    await page.getByRole("button", { name: "Save prices" }).click();
    await expect(page.getByText("Prices saved")).toBeVisible();
    await amai.createPedido(cliente.id, "2030-01-15", [
      { saborId: fresa.id, cantidad: 40 },
    ]);

    // Assert
    expect(await amai.listPedidos()).toEqual([
      expect.objectContaining({ piezas: 40, total: 1000 }),
    ]);
  });
});

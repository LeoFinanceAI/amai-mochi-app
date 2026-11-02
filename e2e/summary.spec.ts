import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.

const today = () => new Date().toLocaleDateString("en-CA");

test.describe("weekly summary", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("shows this week's sales and profit computed in SQL", async ({
    page,
    amai,
  }) => {
    // Arrange: 40 Fresa at $25 delivered today, and $300 of expenses.
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 25);
    const cliente = await amai.createCliente("Tienda Centro", "Guadalajara");
    const pedido = await amai.createPedido(cliente.id, today(), [
      { saborId: fresa.id, cantidad: 40 },
    ]);
    await amai.marcarEntregado(pedido.id);
    await amai.createGasto(today(), 300);

    // Act
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("link", { name: "Summary" }).click();

    // Assert
    const main = page.getByRole("main");
    await expect(main.getByText("You sold")).toBeVisible();
    await expect(main.getByText("$1,000").first()).toBeVisible();
    await expect(main.getByText("$700")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Best-selling flavors" }),
    ).toContainText("Fresa");
    await expect(page.getByRole("region", { name: "By client" })).toContainText(
      "Tienda Centro",
    );
  });
});

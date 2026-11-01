import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.
test.describe("new order", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("saves an order priced by the wholesale tier in SQL", async ({
    page,
    amai,
  }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    await amai.createSabor("Mango", "#F3C443");
    const cliente = await amai.createCliente(
      "Distribuidor Centro",
      "Guadalajara",
    );
    await amai.createPrecio(fresa.id, 20, 18);
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("heading", { name: "New order" }),
    ).toBeVisible();

    // Act
    await page.getByText("Distribuidor Centro · Guadalajara").click();
    const addFresa = page.getByRole("button", {
      name: "Add 5 pieces of Fresa",
    });
    for (let i = 0; i < 8; i++) {
      await addFresa.click();
    }
    await expect(page.getByText("Meets the 40-piece minimum")).toBeVisible();
    await page.getByRole("button", { name: "Save order" }).click();

    // Assert
    await expect(
      page.getByText("Order saved. It is pending delivery and payment."),
    ).toBeVisible();
    await expect
      .poll(() => amai.listPedidoTotales())
      .toEqual([
        { cliente_id: cliente.id, estado: "pendiente", piezas: 40, total: 720 },
      ]);
  });
});

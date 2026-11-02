import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.
test.describe("receivables", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("registers a payment priced by SQL", async ({ page, amai }) => {
    // Arrange
    const fresa = await amai.createSabor("Fresa");
    await amai.setPrecioLista(fresa.id, 25);
    const cliente = await amai.createCliente("Tienda Centro", "Guadalajara");
    const pedido = await amai.createPedido(cliente.id, "2026-01-15", [
      { saborId: fresa.id, cantidad: 40 },
    ]);
    await amai.marcarEntregado(pedido.id);
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("link", { name: "To collect" }).click();
    await expect(page.getByText("Owed to you in total")).toBeVisible();
    await expect(page.getByText("$1,000").first()).toBeVisible();

    // Act
    await page.getByRole("button", { name: "Register payment" }).click();
    await page.getByRole("button", { name: "Transfer" }).click();

    // Assert
    await expect(
      page.getByText("Payment from Tienda Centro registered"),
    ).toBeVisible();
    await expect(page.getByText("All collected")).toBeVisible();
    expect(await amai.listPagos()).toEqual([
      {
        pedido_id: pedido.id,
        cliente_id: cliente.id,
        monto: 1000,
        metodo: "transferencia",
      },
    ]);
  });
});

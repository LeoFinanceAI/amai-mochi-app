import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.
test.describe("expenses", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("saves an expense for today", async ({ page, isMobile, amai }) => {
    // Arrange
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    if (isMobile) {
      await page.getByRole("link", { name: "Settings" }).click();
    }
    await page.getByRole("link", { name: "Expenses" }).click();
    await expect(page.getByText("This week: $0")).toBeVisible();

    // Act
    await page.getByRole("textbox", { name: "Amount" }).fill("350");
    await page.getByText("Packaging").click();
    await page.getByRole("textbox", { name: "Note (optional)" }).fill("Boxes");
    await page.getByRole("button", { name: "Save expense" }).click();

    // Assert
    await expect(page.getByText("This week: $350")).toBeVisible();
    expect(await amai.listGastos()).toEqual([
      { categoria: "empaque", monto: 350, descripcion: "Boxes" },
    ]);
  });
});

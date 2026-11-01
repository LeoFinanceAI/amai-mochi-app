import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects). Made-up data only.
test.describe("clients catalog", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("admin adds a client with a phone typed with spaces", async ({
    page,
    isMobile,
  }) => {
    // Arrange
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    if (isMobile) {
      await page.getByRole("link", { name: "Settings" }).click();
    }
    await page.getByRole("link", { name: "Clients" }).click();
    await expect(
      page.getByText("No clients yet. Add the first one."),
    ).toBeVisible();

    // Act
    await page.getByRole("link", { name: "New client" }).click();
    await page.getByRole("textbox", { name: /Name/ }).fill("Café Luna");
    await page.getByRole("radio", { name: "Event" }).click();
    await page.getByRole("textbox", { name: "Area" }).fill("Colima");
    await page.getByRole("textbox", { name: "Phone" }).fill("312 123 4567");
    await page.getByRole("button", { name: "Save" }).click();

    // Assert
    await expect(page.getByText("Event · Colima")).toBeVisible();
    await page.getByRole("link", { name: /Café Luna/ }).click();
    await expect(page.getByRole("textbox", { name: "Phone" })).toHaveValue(
      "3121234567",
    );
  });
});

import { expect, test } from "./fixtures";

// Runs in English (the browser locale of the e2e projects).
test.describe("flavors catalog", () => {
  test.beforeEach(async ({ createSales }) => {
    await createSales({
      first_name: "John",
      last_name: "Doe",
      email: "john@doe.com",
      password: "password",
    });
  });

  test("admin adds a flavor and retires it", async ({ page, isMobile }) => {
    // Arrange
    await page.goto("/");
    await page.getByLabel("Email").fill("john@doe.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    if (isMobile) {
      await page.getByRole("link", { name: "Settings" }).click();
    }
    await page.getByRole("link", { name: "Flavors" }).click();
    await expect(
      page.getByText("No flavors yet. Add the first one."),
    ).toBeVisible();

    // Act
    await page.getByRole("link", { name: "New flavor" }).click();
    await page.getByRole("textbox", { name: /Name/ }).fill("Matcha");
    await page.getByRole("button", { name: "#8A9A3E" }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // Assert
    const matchaSwitch = page.getByRole("switch", { name: "Active: Matcha" });
    await expect(matchaSwitch).toBeChecked();

    // Act
    await matchaSwitch.click();

    // Assert
    await expect(matchaSwitch).not.toBeChecked();
    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Matcha" })
        .getByText("Inactive"),
    ).toBeVisible();
  });
});

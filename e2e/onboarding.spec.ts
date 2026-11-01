import { test, expect } from "./fixtures";

// The first user signs up and lands on the Amai Mochi home, New order. Atomic's
// onboarding dashboard (contacts and notes steps) is no longer part of the app.
test("first user signs up and lands on New order", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Amai Mochi/);
  await expect(page.getByText("Welcome to Atomic CRM")).toBeVisible();

  await page.getByLabel("First name").fill("John");
  await page.getByLabel("Last name").fill("Doe");
  await page.getByLabel("Email").fill("john@doe.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();
  await expect(page.getByText("What's next?")).toBeHidden();
});

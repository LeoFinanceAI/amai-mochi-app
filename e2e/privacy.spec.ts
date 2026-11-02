import { expect, test } from "@playwright/test";

// Standalone page served from public/privacidad: no sign-in and no database.
const PRIVACY_NOTICE = "/privacidad/";

test.describe("privacy notice", () => {
  test("opens without signing in and covers what the law asks", async ({
    page,
  }) => {
    // Act
    await page.goto(PRIVACY_NOTICE);

    // Assert
    await expect(
      page.getByRole("heading", { name: "Aviso de privacidad" }),
    ).toBeVisible();
    for (const section of [
      "Quién es responsable de tus datos",
      "Qué datos guardamos",
      "Para qué los usamos",
      "Con quién se comparten",
      "Tus derechos",
      "Cambios a este aviso",
    ]) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }
    // Still a draft: not indexed, and the missing data is flagged.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    await expect(page.getByRole("note")).toContainText("Borrador");
  });
});

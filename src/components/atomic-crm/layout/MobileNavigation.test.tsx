import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

describe("MobileNavigation", () => {
  it("links the Amai Mochi screens and settings in Spanish", async () => {
    // Act
    const screen = await renderMobileApp();

    // Assert
    const nav = screen.getByRole("navigation", {
      name: "Navegación de Amai Mochi",
    });
    await expect.element(nav).toBeVisible();
    for (const label of ["Nuevo pedido", "Por cobrar", "Resumen", "Ajustes"]) {
      await expect
        .element(nav.getByRole("link", { name: label }))
        .toBeVisible();
    }
  });

  it("opens the placeholder of a screen not built yet and marks it as current", async () => {
    // Arrange
    const screen = await renderMobileApp();
    const receivables = screen.getByRole("link", { name: "Por cobrar" });

    // Act
    await receivables.click();

    // Assert
    await expect
      .element(screen.getByRole("heading", { name: "Por cobrar" }))
      .toBeVisible();
    await expect
      .element(screen.getByText("Esta pantalla llega en la etapa 3."))
      .toBeVisible();
    await expect.element(receivables).toHaveAttribute("aria-current", "page");
    await expect
      .element(screen.getByRole("link", { name: "Nuevo pedido" }))
      .not.toHaveAttribute("aria-current");
  });
});

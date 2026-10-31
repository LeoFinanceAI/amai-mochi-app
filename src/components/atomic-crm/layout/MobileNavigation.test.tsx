import { memoryStore } from "ra-core";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { createCrmDb, createTestAuthProvider } from "@/test/StoryWrapper";

import { i18nProvider } from "../providers/commons/i18nProvider";
import { createDataProvider } from "../providers/fakerest";
import { CRM } from "../root/CRM";

// The whole mobile app, as Eduardo sees it on a phone with a Spanish browser.
const MobileApp = () => (
  <MemoryRouter initialEntries={["/"]}>
    <CRM
      authProvider={createTestAuthProvider()}
      dataProvider={createDataProvider({ db: createCrmDb(), silent: true })}
      i18nProvider={i18nProvider}
      store={memoryStore()}
      disableTelemetry
    />
  </MemoryRouter>
);

describe("MobileNavigation", () => {
  beforeEach(async () => {
    localStorage.clear();
    await page.viewport(375, 667);
    await i18nProvider.changeLocale("es");
  });

  it("links the Amai Mochi screens and settings in Spanish", async () => {
    // Act
    const screen = await render(<MobileApp />);

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
    const screen = await render(<MobileApp />);
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

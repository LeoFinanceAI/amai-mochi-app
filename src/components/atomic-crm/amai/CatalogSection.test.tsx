import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

describe("Settings on a phone", () => {
  it("links the catalog, the expenses and the public privacy notice", async () => {
    // Act
    const screen = await renderMobileApp({ path: "/settings" });

    // Assert
    const main = screen.getByRole("main");
    for (const [label, href] of [
      ["Sabores", "/sabor"],
      ["Precios", "/prices"],
      ["Clientes", "/cliente"],
      ["Gastos", "/expenses"],
    ]) {
      await expect
        .element(main.getByRole("link", { name: label }))
        .toHaveAttribute("href", href);
    }
    // Outside the hash router: a full page load of public/privacidad.
    await expect
      .element(main.getByRole("link", { name: "Aviso de privacidad" }))
      .toHaveAttribute("href", "/privacidad/");
  });
});

import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

import { NOVEDADES } from "./novedades";

describe("Settings on a phone", () => {
  it("links the catalog and the expenses, without Atomic's MCP server", async () => {
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
    await expect.element(main.getByText(/MCP/)).not.toBeInTheDocument();
  });

  it("says what the app is and links help, release notes and privacy", async () => {
    // Act
    const screen = await renderMobileApp({ path: "/settings" });

    // Assert
    const main = screen.getByRole("main");
    await expect
      .element(main.getByText("Hecha por Leo Fuentes para Amai Mochi"))
      .toBeVisible();
    await expect.element(main.getByText(/^Actualizada el \d/)).toBeVisible();
    const ayuda = main.getByRole("link", { name: "Ayuda (WhatsApp con Leo)" });
    await expect.element(ayuda).toHaveAttribute("target", "_blank");
    const url = new URL(ayuda.element().getAttribute("href") ?? "");
    expect(url.origin + url.pathname).toBe("https://wa.me/523313305631");
    expect(url.searchParams.get("text")).toMatch(/^Hola Leo/);
    await expect
      .element(main.getByRole("link", { name: "Novedades" }))
      .toHaveAttribute("href", "/changelog");
    // Outside the hash router: a full page load of public/privacidad.
    await expect
      .element(main.getByRole("link", { name: "Aviso de privacidad" }))
      .toHaveAttribute("href", "/privacidad/");
  });

  it("shows Amai Mochi's own release notes, newest first", async () => {
    // Arrange
    const screen = await renderMobileApp({ path: "/settings" });

    // Act
    await screen.getByRole("link", { name: "Novedades" }).click();

    // Assert
    await expect
      .element(screen.getByRole("heading", { name: "Novedades", level: 1 }))
      .toBeVisible();
    const fechas = screen
      .getByRole("main")
      .getByRole("heading", { level: 2 })
      .elements()
      .map((heading) => heading.textContent);
    expect(fechas).toHaveLength(NOVEDADES.length);
    expect(fechas[0]).toMatch(/noviembre de 2026/);
    await expect
      .element(screen.getByText(NOVEDADES[0].cambios[0]))
      .toBeVisible();
    // Atomic CRM's changelog is gone.
    await expect
      .element(screen.getByText(/What's Changed/))
      .not.toBeInTheDocument();
  });
});

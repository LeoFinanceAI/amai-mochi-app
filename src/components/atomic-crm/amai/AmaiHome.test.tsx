import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

describe("Amai Mochi home and navigation", () => {
  it("opens on Nuevo pedido on a phone, without the CRM dashboard", async () => {
    // Act
    const screen = await renderMobileApp({ path: "/" });

    // Assert
    await expect
      .element(screen.getByRole("heading", { name: "Nuevo pedido" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Nuevo pedido" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(screen.getByText("What's next?"))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Buscar" }))
      .not.toBeInTheDocument();
  });

  it("shows the Amai screens in the desktop header instead of the CRM ones", async () => {
    // Act
    const screen = await renderMobileApp({ path: "/", device: "desktop" });

    // Assert
    for (const label of [
      "Nuevo pedido",
      "Por cobrar",
      "Resumen",
      "Sabores",
      "Clientes",
    ]) {
      await expect
        .element(screen.getByRole("link", { name: label, exact: true }))
        .toBeVisible();
    }
    for (const label of ["Dashboard", "Contacts", "Companies", "Deals"]) {
      await expect
        .element(screen.getByRole("link", { name: label, exact: true }))
        .not.toBeInTheDocument();
    }
    await expect
      .element(screen.getByRole("button", { name: "Buscar" }))
      .not.toBeInTheDocument();
  });
});

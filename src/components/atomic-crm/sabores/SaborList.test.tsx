import { describe, expect, it } from "vitest";

import {
  renderMobileApp,
  type DataProviderOverride,
} from "@/test/renderMobileApp";

import type { Sabor } from "../types";

const flavors = (): Sabor[] => [
  { id: 1, nombre: "Mango", color: "#F3C443", activo: true },
  { id: 2, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 3, nombre: "Café", color: "#8A5A3C", activo: false },
];

// The mobile app on the flavors screen, as Eduardo would open it.
const renderFlavors = (dataProvider?: DataProviderOverride) =>
  renderMobileApp({
    path: "/sabor",
    data: { sabor: flavors() },
    dataProvider,
  });

describe("flavors screen", () => {
  it("lists active flavors alphabetically and retired ones last", async () => {
    // Act
    const screen = await renderFlavors();

    // Assert
    await expect.element(screen.getByText("Fresa")).toBeVisible();
    const names = screen
      .getByRole("listitem")
      .elements()
      .map((row) => row.textContent);
    expect(names).toEqual(["Fresa", "Mango", "CaféInactivo"]);
  });

  it("retires a flavor with its switch", async () => {
    // Arrange
    const screen = await renderFlavors();
    const mangoSwitch = screen.getByRole("switch", { name: "Activo: Mango" });
    await expect.element(mangoSwitch).toBeChecked();

    // Act
    await mangoSwitch.click();

    // Assert
    await expect.element(mangoSwitch).not.toBeChecked();
    await expect
      .element(
        screen
          .getByRole("listitem")
          .filter({ hasText: "Mango" })
          .getByText("Inactivo"),
      )
      .toBeVisible();
  });

  it("adds a new flavor with a brand color", async () => {
    // Arrange
    const screen = await renderFlavors();
    await screen.getByRole("link", { name: "Nuevo sabor" }).click();

    // Act
    await screen.getByRole("textbox", { name: /Nombre/ }).fill("Matcha");
    await screen.getByRole("button", { name: "#8A9A3E" }).click();
    await screen.getByRole("button", { name: "Guardar" }).click();

    // Assert
    await expect.element(screen.getByText("Matcha")).toBeVisible();
    await expect
      .element(screen.getByRole("switch", { name: "Activo: Matcha" }))
      .toBeChecked();
  });

  it("asks for a name before saving", async () => {
    // Arrange
    const screen = await renderFlavors();
    await screen.getByRole("link", { name: "Nuevo sabor" }).click();

    // Act
    await screen.getByRole("button", { name: "Guardar" }).click();

    // Assert
    await expect.element(screen.getByText("Obligatorio")).toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Nuevo sabor" }))
      .toBeVisible();
  });

  it("explains a duplicate name instead of showing the database error", async () => {
    // Arrange
    const screen = await renderFlavors((base) => ({
      ...base,
      create: async () => {
        throw Object.assign(new Error("duplicate key value"), {
          body: { code: "23505" },
        });
      },
    }));
    await screen.getByRole("link", { name: "Nuevo sabor" }).click();

    // Act
    await screen.getByRole("textbox", { name: /Nombre/ }).fill("Fresa");
    await screen.getByRole("button", { name: "Guardar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Ya existe un sabor con ese nombre."))
      .toBeVisible();
  });
});

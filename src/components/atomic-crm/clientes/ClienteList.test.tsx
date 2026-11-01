import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

import type { Cliente } from "../types";

// Made-up clients: never real customer data in tests.
const clients = (): Cliente[] => [
  {
    id: 1,
    nombre: "Distribuidor Centro",
    tipo: "distribuidor",
    zona: "Guadalajara",
    telefono: "3300000001",
    notas: null,
    activo: true,
  },
  {
    id: 2,
    nombre: "Antigua tienda",
    tipo: "distribuidor",
    zona: "Colima",
    telefono: null,
    notas: null,
    activo: false,
  },
  {
    id: 3,
    nombre: "Boda Ramírez",
    tipo: "evento",
    zona: null,
    telefono: null,
    notas: null,
    activo: true,
  },
];

const openClients = () =>
  renderMobileApp({ path: "/cliente", data: { cliente: clients() } });

type Screen = Awaited<ReturnType<typeof openClients>>;

// Rows of the client list only: toasts are list items too.
const clientRows = (screen: Screen) =>
  screen.getByRole("main").getByRole("listitem");

describe("clients screen", () => {
  it("shows each client's type and area, inactive ones last", async () => {
    // Act
    const screen = await openClients();

    // Assert
    await expect
      .element(screen.getByText("Distribuidor · Guadalajara"))
      .toBeVisible();
    await expect.element(screen.getByText("Evento")).toBeVisible();
    const rows = clientRows(screen)
      .elements()
      .map((row) => row.textContent);
    expect(rows).toEqual([
      "Boda RamírezEvento",
      "Distribuidor CentroDistribuidor · Guadalajara",
      "Antigua tiendaInactivoDistribuidor · Colima",
    ]);
  });

  it("saves a phone typed with spaces and dashes as digits", async () => {
    // Arrange
    const screen = await openClients();
    await screen.getByRole("link", { name: "Nuevo cliente" }).click();

    // Act
    await screen.getByRole("textbox", { name: /Nombre/ }).fill("Café Luna");
    await screen.getByRole("radio", { name: "Público" }).click();
    await screen.getByRole("textbox", { name: "Zona" }).fill("Colima");
    await screen
      .getByRole("textbox", { name: "Teléfono" })
      .fill("312 123-4567");
    await screen.getByRole("button", { name: "Guardar" }).click();
    await screen.getByRole("link", { name: /Café Luna/ }).click();

    // Assert
    await expect
      .element(screen.getByRole("textbox", { name: "Teléfono" }))
      .toHaveValue("3121234567");
    await expect
      .element(screen.getByRole("radio", { name: "Público" }))
      .toBeChecked();
  });

  it("rejects a phone that is too short for WhatsApp", async () => {
    // Arrange
    const screen = await openClients();
    await screen.getByRole("link", { name: "Nuevo cliente" }).click();
    await screen.getByRole("textbox", { name: /Nombre/ }).fill("Café Luna");

    // Act
    await screen.getByRole("textbox", { name: "Teléfono" }).fill("12345");
    await screen.getByRole("button", { name: "Guardar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Escribe 10 dígitos, o 12 con 52 al inicio."))
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Nuevo cliente" }))
      .toBeVisible();
  });

  it("moves a client to the end of the list when marked inactive", async () => {
    // Arrange
    const screen = await openClients();
    await screen.getByRole("link", { name: /Boda Ramírez/ }).click();

    // Act
    await screen.getByRole("switch", { name: "Activo" }).click();
    await screen.getByRole("button", { name: "Guardar" }).click();

    // Assert
    await expect
      .element(
        clientRows(screen)
          .filter({ hasText: "Boda Ramírez" })
          .getByText("Inactivo"),
      )
      .toBeVisible();
    const rows = clientRows(screen).elements();
    expect(rows.at(-1)?.textContent).toContain("Boda Ramírez");
  });
});

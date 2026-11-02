import type { DataProvider } from "ra-core";
import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";

import type { Gasto } from "../types";
import { fechaDesde, lunesDeLaSemana } from "./gastoForm";

// One expense this week (Monday) and one from three weeks ago.
const gastos = (): Gasto[] => [
  {
    id: 1,
    fecha: lunesDeLaSemana(),
    categoria: "ingredientes",
    monto: 400,
    descripcion: "Harina de arroz",
  },
  {
    id: 2,
    fecha: fechaDesde(21),
    categoria: "empaque",
    monto: 150,
    descripcion: null,
  },
];

const openExpenses = async () => {
  let store: DataProvider | undefined;
  const screen = await renderMobileApp({
    path: "/expenses",
    data: { gasto: gastos() },
    dataProvider: (base) => {
      store = base;
      return base;
    },
  });
  const guardados = async () =>
    (
      await store!.getList<Gasto>("gasto", {
        pagination: { page: 1, perPage: 50 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      })
    ).data;
  return { screen, guardados };
};

describe("expenses screen", () => {
  it("lists recent expenses and totals only this week", async () => {
    // Act
    const { screen } = await openExpenses();

    // Assert
    await expect.element(screen.getByText("Esta semana: $400")).toBeVisible();
    await expect.element(screen.getByText("$400 · Ingredientes")).toBeVisible();
    await expect.element(screen.getByText("$150 · Empaque")).toBeVisible();
    await expect
      .element(screen.getByText(/Harina de arroz/))
      .toBeInTheDocument();
  });

  it("saves an expense and adds it to the week", async () => {
    // Arrange
    const { screen, guardados } = await openExpenses();
    const save = screen.getByRole("button", { name: "Guardar gasto" });
    await expect.element(save).toBeDisabled();

    // Act
    await screen.getByRole("textbox", { name: "Monto" }).fill("120,50");
    await screen.getByText("Gasolina y transporte").click();
    await screen
      .getByRole("textbox", { name: "Nota (opcional)" })
      .fill("Gasolina a Colima");
    await save.click();

    // Assert
    await expect.element(screen.getByText("Gasto guardado")).toBeVisible();
    await expect.element(screen.getByText("Esta semana: $520.5")).toBeVisible();
    expect(await guardados()).toContainEqual(
      expect.objectContaining({
        monto: 120.5,
        categoria: "transporte",
        descripcion: "Gasolina a Colima",
      }),
    );
    await expect
      .element(screen.getByRole("textbox", { name: "Monto" }))
      .toHaveValue("");
  });

  it("deletes an expense, with undo", async () => {
    // Arrange
    const { screen, guardados } = await openExpenses();

    // Act
    await screen.getByRole("button", { name: "Borrar $150 Empaque" }).click();
    await screen.getByRole("button", { name: "Deshacer" }).click();

    // Assert
    await expect.element(screen.getByText("$150 · Empaque")).toBeVisible();
    expect(await guardados()).toHaveLength(2);

    // Act again, letting the notice close this time.
    await screen.getByRole("button", { name: "Borrar $150 Empaque" }).click();
    await screen.getByRole("button", { name: /close/i }).click();

    // Assert
    await expect.poll(async () => (await guardados()).length).toBe(1);
  });
});

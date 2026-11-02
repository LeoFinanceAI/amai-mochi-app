import { describe, expect, it } from "vitest";

import { formVacio, lunesDeLaSemana, toGasto, totalDesde } from "./gastoForm";

describe("lunesDeLaSemana", () => {
  it("returns the Monday of the week, Sundays included", () => {
    // Act + Assert: Nov 2026 starts on a Sunday.
    expect(lunesDeLaSemana(new Date(2026, 10, 1, 22, 0))).toBe("2026-10-26");
    expect(lunesDeLaSemana(new Date(2026, 10, 2, 8, 0))).toBe("2026-11-02");
    expect(lunesDeLaSemana(new Date(2026, 10, 7, 23, 59))).toBe("2026-11-02");
  });
});

describe("toGasto", () => {
  const base = {
    ...formVacio(new Date(2026, 10, 2)),
    categoria: "empaque" as const,
  };

  it("builds the row with a trimmed note", () => {
    // Act
    const gasto = toGasto({ ...base, monto: "350.5", descripcion: "  cajas " });

    // Assert
    expect(gasto).toEqual({
      monto: 350.5,
      categoria: "empaque",
      fecha: "2026-11-02",
      descripcion: "cajas",
    });
  });

  it("is not ready without a positive amount or a category", () => {
    // Act + Assert
    expect(toGasto({ ...base, monto: "0" })).toBeNull();
    expect(toGasto({ ...base, monto: "" })).toBeNull();
    expect(toGasto({ ...base, monto: "abc" })).toBeNull();
    expect(toGasto({ ...base, monto: "100", categoria: null })).toBeNull();
  });
});

describe("totalDesde", () => {
  it("adds only the expenses from the given day on", () => {
    // Arrange
    const gastos = [
      {
        id: 1,
        fecha: "2026-11-02",
        categoria: "otro",
        monto: 100,
        descripcion: null,
      },
      {
        id: 2,
        fecha: "2026-11-01",
        categoria: "otro",
        monto: 50,
        descripcion: null,
      },
      {
        id: 3,
        fecha: "2026-11-05",
        categoria: "otro",
        monto: 25.5,
        descripcion: null,
      },
    ] as const;

    // Act + Assert
    expect(totalDesde([...gastos], "2026-11-02")).toBe(125.5);
  });
});

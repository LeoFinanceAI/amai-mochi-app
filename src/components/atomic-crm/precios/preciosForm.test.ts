import { describe, expect, it } from "vitest";

import { cambios, esPrecioValido } from "./preciosForm";

describe("esPrecioValido", () => {
  it("accepts whole pesos and up to two decimals", () => {
    // Act + Assert
    for (const texto of ["0", "25", " 25 ", "25.5", "25.50"]) {
      expect(esPrecioValido(texto)).toBe(true);
    }
  });

  it("rejects empty, negative, text, three decimals and absurd amounts", () => {
    // Act + Assert
    for (const texto of ["", "-5", "veinte", "25.505", "1e3", "100001"]) {
      expect(esPrecioValido(texto)).toBe(false);
    }
  });
});

describe("cambios", () => {
  it("returns only the prices that actually changed", () => {
    // Arrange
    const productos = [
      { id: 1, precio_lista: 25 },
      { id: 2, precio_lista: 25 },
      { id: 3, precio_lista: 0 },
    ];

    // Act
    const result = cambios(productos, { 1: "25.00", 2: "28", 3: "0" });

    // Assert
    expect(result).toEqual([{ id: 2, precio_lista: 28 }]);
  });
});

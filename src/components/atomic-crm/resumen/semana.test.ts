import { describe, expect, it } from "vitest";

import { cambioPorcentual, lunesElegido, moverSemanas } from "./semana";

// Wednesday, Nov 4 2026: its Monday is Nov 2.
const hoy = new Date(2026, 10, 4, 21, 0);

describe("lunesElegido", () => {
  it("shows this week when the address has no valid week", () => {
    // Act + Assert
    expect(lunesElegido(null, hoy)).toBe("2026-11-02");
    expect(lunesElegido("ayer", hoy)).toBe("2026-11-02");
  });

  it("moves any day to its Monday, and never shows a future week", () => {
    // Act + Assert
    expect(lunesElegido("2026-10-29", hoy)).toBe("2026-10-26");
    expect(lunesElegido("2026-12-01", hoy)).toBe("2026-11-02");
  });
});

describe("moverSemanas", () => {
  it("jumps whole weeks across months", () => {
    // Act + Assert
    expect(moverSemanas("2026-11-02", -1)).toBe("2026-10-26");
    expect(moverSemanas("2026-10-26", 1)).toBe("2026-11-02");
  });
});

describe("cambioPorcentual", () => {
  it("compares with last week, or says nothing when last week sold zero", () => {
    // Act + Assert
    expect(cambioPorcentual(1120, 1000)).toBe(12);
    expect(cambioPorcentual(500, 1000)).toBe(-50);
    expect(cambioPorcentual(500, 0)).toBeNull();
  });
});

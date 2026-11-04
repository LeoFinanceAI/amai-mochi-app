import { describe, expect, it } from "vitest";

import { mesElegido, moverMeses } from "./mes";

describe("mesElegido", () => {
  const hoy = new Date(2026, 10, 5);

  it("uses the month in the address, never a future one", () => {
    expect(mesElegido("2026-09", hoy)).toBe("2026-09");
    expect(mesElegido("2027-01", hoy)).toBe("2026-11");
  });

  it("falls back to this month when the address has none or a bad one", () => {
    expect(mesElegido(null, hoy)).toBe("2026-11");
    expect(mesElegido("2026-13", hoy)).toBe("2026-11");
  });
});

describe("moverMeses", () => {
  it("moves across years", () => {
    expect(moverMeses("2026-01", -1)).toBe("2025-12");
    expect(moverMeses("2026-12", 1)).toBe("2027-01");
  });
});

import { describe, expect, it } from "vitest";

import { fechaEntrega } from "./fechaEntrega";

describe("fechaEntrega", () => {
  it("uses the local day for an order taken late at night", () => {
    // Arrange: 11:30 pm local, already the next day in UTC.
    const lateNight = new Date(2026, 10, 1, 23, 30);

    // Act + Assert
    expect(fechaEntrega("manana", "", lateNight)).toBe("2026-11-02");
    expect(fechaEntrega("pasado", "", lateNight)).toBe("2026-11-03");
  });

  it("rolls over to the next month", () => {
    // Arrange
    const lastDay = new Date(2026, 9, 31, 10, 0);

    // Act + Assert
    expect(fechaEntrega("manana", "", lastDay)).toBe("2026-11-01");
    expect(fechaEntrega("pasado", "", lastDay)).toBe("2026-11-02");
  });

  it("returns the picked date for another day, or nothing yet", () => {
    // Act + Assert
    expect(fechaEntrega("otra", "2026-12-24")).toBe("2026-12-24");
    expect(fechaEntrega("otra", "")).toBe("");
  });
});

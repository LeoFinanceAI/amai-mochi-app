import { describe, expect, it } from "vitest";

import { mesActual, rangoDelMes, toCsv } from "./csv";

describe("toCsv", () => {
  it("writes an Excel-ready file with quoted text and plain numbers", () => {
    // Act
    const csv = toCsv([
      ["Cliente", "Monto"],
      ['Café "Norte", Centro', 1500.5],
      ["Sin monto", null],
    ]);

    // Assert
    expect(csv).toBe(
      '﻿"Cliente","Monto"\r\n"Café ""Norte"", Centro",1500.5\r\n"Sin monto",\r\n',
    );
  });

  it("keeps text that looks like a formula as text", () => {
    // Act
    const csv = toCsv([['=HYPERLINK("x")', "+52 33", "-", "@a", -20]]);

    // Assert
    expect(csv).toBe('﻿"\'=HYPERLINK(""x"")","\'+52 33","\'-","\'@a",-20\r\n');
  });
});

describe("rangoDelMes", () => {
  it("returns the first and last day of the month", () => {
    expect(rangoDelMes("2026-02")).toEqual({
      desde: "2026-02-01",
      hasta: "2026-02-28",
    });
    expect(rangoDelMes("2028-02").hasta).toBe("2028-02-29");
    expect(rangoDelMes("2026-11").hasta).toBe("2026-11-30");
  });

  it("names the current month as YYYY-MM", () => {
    expect(mesActual(new Date(2026, 0, 31))).toBe("2026-01");
  });
});

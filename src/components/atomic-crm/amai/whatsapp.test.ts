import { describe, expect, it } from "vitest";

import { whatsappUrl } from "./whatsapp";

describe("whatsappUrl", () => {
  it("adds Mexico's code to a 10-digit phone and encodes the message", () => {
    // Act
    const url = new URL(whatsappUrl("3312345678", "Hola Ana & Co.")!);

    // Assert
    expect(url.origin + url.pathname).toBe("https://wa.me/523312345678");
    expect(url.searchParams.get("text")).toBe("Hola Ana & Co.");
  });

  it("keeps a phone that already has the country code, and needs a phone", () => {
    // Act + Assert
    expect(whatsappUrl("523312345678", "x")).toMatch(
      /^https:\/\/wa\.me\/523312345678\?/,
    );
    expect(whatsappUrl(null, "x")).toBeNull();
  });
});

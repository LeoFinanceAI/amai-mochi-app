import { describe, expect, it } from "vitest";

import { mapsUrl } from "./formatoPedido";

describe("mapsUrl", () => {
  it("opens a Maps link the client sent as is", () => {
    // Act + Assert
    expect(mapsUrl(" https://maps.app.goo.gl/abc123 ", "Colima")).toBe(
      "https://maps.app.goo.gl/abc123",
    );
  });

  it("searches an address together with the client's area", () => {
    // Act
    const url = new URL(mapsUrl("Av. Juárez 100", "Guadalajara"));

    // Assert
    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("query")).toBe("Av. Juárez 100, Guadalajara");
  });

  it("never opens a script or data link, only searches it as text", () => {
    // Act
    const url = new URL(mapsUrl("javascript:alert(1)", null));

    // Assert
    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("query")).toBe("javascript:alert(1)");
  });
});

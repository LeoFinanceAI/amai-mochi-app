import { test, expect, type Page } from "@playwright/test";

// Standalone page served from public/cuestionario: no sign-in and no database.
const QUESTIONNAIRE = "/cuestionario/";

const whatsappMessage = async (page: Page): Promise<string> => {
  const href = await page
    .getByRole("link", { name: "Enviar a Leo por WhatsApp" })
    .getAttribute("href");
  return new URL(href ?? "").searchParams.get("text") ?? "";
};

test.describe("questionnaire for Eduardo", () => {
  test("counts answers and writes them into the WhatsApp message", async ({
    page,
  }) => {
    // Arrange
    await page.goto(QUESTIONNAIRE);
    await expect(page.getByText("0 de 33")).toBeVisible();

    // Act
    await page.getByRole("radio", { name: "Por caja" }).check();
    await page
      .getByLabel("Si es por caja, ¿cuántas piezas trae?")
      .fill("12 piezas");
    await page.getByRole("checkbox", { name: "Mango" }).check();

    // Assert
    await expect(page.getByText("2 de 33")).toBeVisible();
    const message = await whatsappMessage(page);
    expect(message).toContain(
      "1. ¿Vendes por pieza, por caja o ambos? Por caja — 12 piezas",
    );
    expect(message).toContain("2. ¿Qué sabores manejas hoy? Mango");
  });

  test("asks how long the mochis last and how they are labelled", async ({
    page,
  }) => {
    // Arrange
    await page.goto(QUESTIONNAIRE);

    // Act
    await page.getByRole("radio", { name: "Cambia según el sabor" }).check();
    await page
      .getByLabel("¿Cuántos días o meses? Si cambia, ¿cuánto dura cada sabor?")
      .fill("Fresa 2 meses, Oreo 3 meses");
    await page.getByRole("radio", { name: "Sello" }).check();

    // Assert
    await expect(page.getByText("2 de 33")).toBeVisible();
    const message = await whatsappMessage(page);
    expect(message).toContain("*Empaque y etiquetas*");
    expect(message).toContain(
      "¿Es igual para todos los sabores? Cambia según el sabor — Fresa 2 meses, Oreo 3 meses",
    );
    expect(message).toContain(
      "¿Cómo pones hoy la fecha de elaboración y de caducidad? Sello",
    );
  });

  test("leaves the optional section out of the message until it is answered", async ({
    page,
  }) => {
    // Arrange
    await page.goto(QUESTIONNAIRE);
    expect(await whatsappMessage(page)).not.toContain("Más adelante");

    // Act
    await page
      .getByRole("group", {
        name: "¿Sabes cuánto te cuesta hacer cada mochi?",
      })
      .getByRole("radio", { name: "Más o menos" })
      .check();

    // Assert
    expect(await whatsappMessage(page)).toContain(
      "¿Sabes cuánto te cuesta hacer cada mochi? Más o menos",
    );
    await expect(page.getByText("0 de 33")).toBeVisible();
  });

  test("keeps a draft of the answers after reloading the page", async ({
    page,
  }) => {
    // Arrange
    await page.goto(QUESTIONNAIRE);
    await page.getByRole("checkbox", { name: "Android" }).check();
    await expect(page.getByText("1 de 33")).toBeVisible();

    // Act
    await page.reload();

    // Assert
    await expect(page.getByRole("checkbox", { name: "Android" })).toBeChecked();
    await expect(page.getByText("1 de 33")).toBeVisible();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import englishMessages from "ra-language-english";
import { getInitialLocale, i18nProvider } from "./i18nProvider";
import { spanishRaMessages } from "./spanishRaMessages";

// Dotted paths of every string in a nested message catalog.
const leafKeys = (messages: object, prefix = ""): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string"
      ? [`${prefix}${key}`]
      : leafKeys(value as object, `${prefix}${key}.`),
  );

const readKey = (messages: object, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[key]
          : undefined,
      messages,
    );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("i18nProvider", () => {
  it("registers en, fr and es locales", () => {
    expect(i18nProvider.getLocales?.()).toEqual([
      { locale: "en", name: "English" },
      { locale: "fr", name: "Français" },
      { locale: "es", name: "Español" },
    ]);
  });

  it("translates the language key in french", async () => {
    await i18nProvider.changeLocale("fr");

    expect(i18nProvider.translate("crm.language")).toBe("Langue");
  });

  it("falls back to english for unknown locales", async () => {
    await i18nProvider.changeLocale("de");

    expect(i18nProvider.translate("crm.language")).toBe("Language");
  });

  it("uses customized password reset overrides for en and fr", async () => {
    await i18nProvider.changeLocale("en");
    expect(i18nProvider.translate("ra-supabase.auth.password_reset")).toBe(
      "Check your emails for a Reset Password message.",
    );

    await i18nProvider.changeLocale("fr");
    expect(i18nProvider.translate("ra-supabase.auth.password_reset")).toBe(
      "Consultez vos emails pour trouver le message de reinitialisation du mot de passe.",
    );
  });

  it("translates recently added fr crm keys", async () => {
    await i18nProvider.changeLocale("fr");

    expect(i18nProvider.translate("resources.deals.empty.title")).toBe(
      "Aucune affaire trouvée",
    );
  });

  it("uses browser french locale when available", () => {
    vi.stubGlobal("navigator", {
      language: "fr-FR",
      languages: ["fr-FR", "en-US"],
    });

    expect(getInitialLocale()).toBe("fr");
  });

  it("translates the Amai navigation in spanish", async () => {
    await i18nProvider.changeLocale("es");

    expect(i18nProvider.translate("amai.navigation.new_order")).toBe(
      "Nuevo pedido",
    );
  });

  it("translates sign-in, buttons and settings in spanish", async () => {
    await i18nProvider.changeLocale("es");

    expect(i18nProvider.translate("ra.auth.sign_in")).toBe("Iniciar sesión");
    expect(i18nProvider.translate("ra.action.save")).toBe("Guardar");
    expect(i18nProvider.translate("ra-supabase.auth.forgot_password")).toBe(
      "¿Olvidaste tu contraseña?",
    );
    expect(i18nProvider.translate("crm.settings.title")).toBe("Ajustes");
  });

  it("falls back to english for the crm screens amai mochi does not use", async () => {
    await i18nProvider.changeLocale("es");

    expect(
      i18nProvider.translate("resources.contacts.name", { smart_count: 2 }),
    ).toBe("Contacts");
  });

  it("has a spanish text for every react-admin message", () => {
    const missing = leafKeys(englishMessages).filter(
      (key) => readKey(spanishRaMessages, key) === undefined,
    );

    expect(missing).toEqual([]);
  });

  it("uses browser spanish locale for es-MX", () => {
    vi.stubGlobal("navigator", {
      language: "es-MX",
      languages: ["es-MX", "en-US"],
    });

    expect(getInitialLocale()).toBe("es");
  });

  it("falls back to english when browser locale is unsupported", () => {
    vi.stubGlobal("navigator", {
      language: "pt-BR",
      languages: ["pt-BR", "de-DE"],
    });

    expect(getInitialLocale()).toBe("en");
  });
});

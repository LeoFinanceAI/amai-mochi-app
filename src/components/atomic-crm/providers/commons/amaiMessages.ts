// Messages for the Amai Mochi screens. Spanish (es-MX) is the business language;
// English mirrors it so the keys never render raw in the en/fr catalogs.
// The rest of the Atomic CRM UI is not translated to Spanish yet: the "es"
// catalog falls back to English for every key not listed here.

export const englishAmaiMessages = {
  amai: {
    navigation: {
      label: "Amai Mochi navigation",
      new_order: "New order",
      receivables: "To collect",
      summary: "Summary",
      settings: "Settings",
    },
    coming_soon: {
      title: "Coming soon",
      body: "This screen arrives in stage %{stage}.",
    },
  },
};

export const spanishAmaiMessages = {
  amai: {
    navigation: {
      label: "Navegación de Amai Mochi",
      new_order: "Nuevo pedido",
      receivables: "Por cobrar",
      summary: "Resumen",
      settings: "Ajustes",
    },
    coming_soon: {
      title: "Muy pronto",
      body: "Esta pantalla llega en la etapa %{stage}.",
    },
  },
};

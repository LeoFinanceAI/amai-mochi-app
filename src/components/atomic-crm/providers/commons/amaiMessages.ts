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
    catalog: {
      title: "Catalog",
    },
    flavors: {
      add: "New flavor",
      create_title: "New flavor",
      edit_title: "Edit flavor",
      empty: "No flavors yet. Add the first one.",
      inactive: "Inactive",
      active_toggle: "Active: %{name}",
      duplicate: "A flavor with that name already exists.",
      color_hint: "Shown next to the flavor in orders and charts.",
      invalid_color: "Pick a color, like #EE8FA8.",
    },
  },
  resources: {
    sabor: {
      name: "Flavor |||| Flavors",
      fields: {
        nombre: "Name",
        color: "Color",
        activo: "Active",
      },
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
    catalog: {
      title: "Catálogo",
    },
    flavors: {
      add: "Nuevo sabor",
      create_title: "Nuevo sabor",
      edit_title: "Editar sabor",
      empty: "Todavía no hay sabores. Agrega el primero.",
      inactive: "Inactivo",
      active_toggle: "Activo: %{name}",
      duplicate: "Ya existe un sabor con ese nombre.",
      color_hint: "Se muestra junto al sabor en pedidos y gráficas.",
      invalid_color: "Elige un color, por ejemplo #EE8FA8.",
    },
  },
  resources: {
    sabor: {
      name: "Sabor |||| Sabores",
      fields: {
        nombre: "Nombre",
        color: "Color",
        activo: "Activo",
      },
    },
  },
  // Only the react-admin strings the Amai screens show; the full Spanish
  // translation of the CRM is a separate task.
  ra: {
    action: {
      save: "Guardar",
      cancel: "Cancelar",
      back: "Regresar",
    },
    notification: {
      created: "Guardado",
      updated: "Guardado |||| %{smart_count} guardados",
      http_error: "No se pudo conectar con el servidor",
    },
    validation: {
      required: "Obligatorio",
      maxLength: "Máximo %{max} caracteres",
    },
  },
};

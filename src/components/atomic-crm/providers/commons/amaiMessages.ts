// Messages for the Amai Mochi screens. Spanish (es-MX) is the business language;
// English mirrors it so the keys never render raw in the en/fr catalogs.
// Spanish for react-admin and the CRM screens lives in spanishRaMessages.ts and
// spanishCrmMessages.ts.

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
    clients: {
      add: "New client",
      create_title: "New client",
      edit_title: "Edit client",
      empty: "No clients yet. Add the first one.",
      inactive: "Inactive",
      phone_hint: "10 digits. Used to message them on WhatsApp.",
      invalid_phone: "Write 10 digits, or 12 with 52 in front.",
      zona_placeholder: "Guadalajara, Colima, Tepetitlán…",
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
    cliente: {
      name: "Client |||| Clients",
      fields: {
        nombre: "Name",
        tipo: "Type",
        zona: "Area",
        telefono: "Phone",
        notas: "Notes",
        activo: "Active",
      },
      tipos: {
        distribuidor: "Distributor",
        publico: "Public",
        evento: "Event",
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
    clients: {
      add: "Nuevo cliente",
      create_title: "Nuevo cliente",
      edit_title: "Editar cliente",
      empty: "Todavía no hay clientes. Agrega el primero.",
      inactive: "Inactivo",
      phone_hint: "10 dígitos. Sirve para escribirle por WhatsApp.",
      invalid_phone: "Escribe 10 dígitos, o 12 con 52 al inicio.",
      zona_placeholder: "Guadalajara, Colima, Tepetitlán…",
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
    cliente: {
      name: "Cliente |||| Clientes",
      fields: {
        nombre: "Nombre",
        tipo: "Tipo",
        zona: "Zona",
        telefono: "Teléfono",
        notas: "Notas",
        activo: "Activo",
      },
      tipos: {
        distribuidor: "Distribuidor",
        publico: "Público",
        evento: "Evento",
      },
    },
  },
};

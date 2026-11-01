import type { PartialCrmMessages } from "./englishCrmMessages";

// Spanish (es-MX) for the Atomic CRM screens Amai Mochi keeps: sign-in, the
// header and search, settings, profile and user management. Contacts,
// companies, deals, notes and tasks are not used by the business and fall back
// to English until they are removed.
export const spanishCrmMessages: PartialCrmMessages = {
  resources: {
    sales: {
      name: "Usuario |||| Usuarios",
      fields: {
        first_name: "Nombre",
        last_name: "Apellido",
        email: "Correo",
        secondary_email: "Correo adicional",
        secondary_emails: "Correos adicionales",
        administrator: "Administrador",
        disabled: "Desactivado",
      },
      create: {
        error: "Hubo un error al crear el usuario.",
        success:
          "Usuario creado. En unos minutos le llegará un correo para elegir su contraseña.",
        title: "Nuevo usuario",
      },
      edit: {
        error: "Hubo un error. Inténtalo de nuevo.",
        record_not_found: "No se encontró el usuario",
        success: "Usuario actualizado",
        title: "Editar a %{name}",
      },
      action: {
        new: "Nuevo usuario",
      },
    },
  },
  crm: {
    action: {
      reset_password: "Cambiar contraseña",
    },
    auth: {
      first_name: "Nombre",
      last_name: "Apellido",
      confirm_password: "Confirma tu contraseña",
      confirmation_required:
        "Abre el enlace que te acabamos de mandar por correo para confirmar tu cuenta.",
      recovery_email_sent:
        "Si tienes una cuenta, en unos minutos te llegará un correo para recuperar tu contraseña.",
      sign_in_failed: "No se pudo iniciar sesión.",
      sign_in_google_workspace: "Iniciar sesión con Google Workspace",
      signup: {
        create_account: "Crear cuenta",
        create_first_user:
          "Crea la primera cuenta de usuario para terminar la configuración.",
        creating: "Creando...",
        initial_user_created: "Primera cuenta creada",
      },
      welcome_title: "Bienvenido a Amai Mochi",
    },
    common: {
      account_manager: "Responsable",
      activity: "Actividad",
      added: "agregó",
      details: "Detalles",
      last_activity_with_date: "última actividad %{date}",
      load_more: "Cargar más",
      misc: "Otros",
      past: "Pasadas",
      read_more: "Leer más",
      retry: "Reintentar",
      show_less: "Mostrar menos",
      copied: "¡Copiado!",
      copy: "Copiar",
      loading: "Cargando...",
      me: "Yo",
    },
    changelog: {
      title: "Novedades",
    },
    header: {
      import_data: "Importar desde JSON",
    },
    search: {
      title: "Buscar",
      placeholder: "Buscar...",
      hint: "Escribe al menos %{min} caracteres para buscar",
      empty: "No se encontraron resultados",
      error: "La búsqueda no está disponible ahorita. Inténtalo de nuevo.",
      untitled_result: "(sin título)",
      show_more: "Mostrar más",
    },
    image_editor: {
      change: "Cambiar",
      drop_hint: "Arrastra un archivo para subirlo, o toca para elegirlo.",
      editable_content: "Contenido editable",
      title: "Subir y recortar imagen",
      update_image: "Actualizar imagen",
    },
    settings: {
      about: "Acerca de",
      dark_mode_logo: "Logo en modo oscuro",
      light_mode_logo: "Logo en modo claro",
      reset_defaults: "Restablecer valores",
      save_error: "No se pudo guardar la configuración",
      saved: "Configuración guardada",
      saving: "Guardando...",
      preferences: "Preferencias",
      title: "Ajustes",
      app_title: "Nombre de la app",
      sections: {
        branding: "Marca",
      },
    },
    theme: {
      dark: "Oscuro",
      label: "Tema",
      light: "Claro",
      system: "Automático",
    },
    language: "Idioma",
    navigation: {
      label: "Navegación",
    },
    profile: {
      add_secondary_email: "Agregar un correo",
      email_taken: "%{email} ya lo usa otro usuario",
      no_secondary_emails: "Ninguno",
      secondary_email_invalid: "%{email} no es un correo válido",
      secondary_email_is_primary: "%{email} ya es tu correo principal",
      secondary_email_taken: "%{email} ya lo usa otro usuario",
      too_many_secondary_emails:
        "No puedes agregar más de 10 correos adicionales",
      secondary_emails_help:
        "Otros correos desde los que escribes. Deja uno vacío para quitarlo.",
      inbound: {
        description:
          "Puedes mandar correos a la dirección de entrada de tu servidor, por ejemplo poniéndola en el campo %{field}. La app procesará los correos y agregará notas a los contactos correspondientes.",
        title: "Correo de entrada",
      },
      mcp: {
        title: "Servidor MCP",
        description:
          "Usa esta dirección para conectar tu asistente de IA a los datos de la app mediante el Model Context Protocol (MCP).",
      },
      password: {
        change: "Cambiar contraseña",
      },
      password_reset_sent: "Te mandamos un correo para cambiar tu contraseña",
      record_not_found: "No se encontró el perfil",
      title: "Perfil",
      updated: "Tu perfil se actualizó",
      update_error: "Hubo un error. Inténtalo de nuevo",
    },
    validation: {
      invalid_url: "Debe ser una dirección web válida",
    },
  },
};

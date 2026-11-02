import { NOVEDADES } from "./novedades";

// Who to write to when something in the app fails: Leo, who builds it
// (number given by Leo for this button).
const SUPPORT_WHATSAPP = "523313305631";

export const PRIVACY_NOTICE_URL = "/privacidad/";

export const ayudaUrl = (mensaje: string): string =>
  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

// The date of the newest release note: when the app last changed.
export const ultimaActualizacion = (): string => NOVEDADES[0].fecha;

// Shared by the receivables reminder and the order confirmation.

// wa.me needs the country code: a 10-digit Mexican number gets 52 in front.
// Returns null when the client has no phone.
export const whatsappUrl = (
  telefono: string | null,
  mensaje: string,
): string | null => {
  if (!telefono) return null;
  const numero = telefono.length === 10 ? `52${telefono}` : telefono;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};

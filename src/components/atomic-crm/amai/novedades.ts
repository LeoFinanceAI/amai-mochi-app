// "Novedades": what changed in the app, written for Eduardo in plain Spanish
// (runtime content shown as is, like the questionnaire). Newest first; add an
// entry with each change he can see. Dates are Mexico dates, YYYY-MM-DD.
export interface Novedad {
  fecha: string;
  cambios: string[];
}

export const NOVEDADES: ReadonlyArray<Novedad> = [
  {
    fecha: "2026-11-04",
    cambios: [
      "Venta rápida: para ventas al público o en eventos, se cobra al momento y sin mínimo de piezas. Está arriba en Nuevo pedido.",
      "Tus clientes: quién te compra más y qué distribuidores llevan más de 30 días sin pedir, con un botón para escribirles. Está al final de Tu semana.",
      "Por cobrar: el botón Recordar a los clientes con pedidos de más de 7 días te lleva uno por uno a su WhatsApp con el mensaje de cobro ya escrito.",
      "Exportar a Excel: baja las ventas, los cobros o los gastos de un mes para mandárselos a tu contador. Está en Ajustes → Dinero.",
      "Clientes: al abrir un cliente ves cuánto te ha comprado, cuántos pedidos lleva, cuánto te debe y sus últimos pedidos.",
      "Producción: cuántas piezas de cada sabor preparar para los pedidos de mañana (o de hoy, o de pasado mañana). Está en Pedidos.",
      "Nuevo pedido: al elegir un cliente, el botón Repetir el último pedido llena los sabores, la forma de pago y la ubicación; solo ajustas lo que cambie.",
      "Pedidos: el botón Confirmar por WhatsApp le manda al cliente el resumen de su pedido (sabores, total, día de entrega y forma de pago).",
    ],
  },
  {
    fecha: "2026-11-02",
    cambios: [
      "Cuando haya una versión nueva de la app, verás un aviso con el botón Actualizar.",
      "Ajustes → Acerca de: botón de Ayuda para escribirle a Leo por WhatsApp.",
      "Tu semana: cuánto vendiste, cobraste, gastaste y ganaste, con las piezas por día y los sabores más vendidos.",
      "Por cobrar: quién te debe y cuánto, recordatorio por WhatsApp y registro de pagos.",
      "Gastos: anota lo que gastas en ingredientes, empaque, gasolina y otros.",
      "Aviso de privacidad para tus clientes (en borrador).",
    ],
  },
  {
    fecha: "2026-11-01",
    cambios: [
      "Precios: el precio por pieza de cada sabor.",
      "Pedidos: la lista por día de entrega; márcalos como entregados, edítalos o cancélalos.",
      "Entregas de hoy, con la dirección que abre Maps.",
    ],
  },
  {
    fecha: "2026-10-31",
    cambios: [
      "Nuevo pedido: cliente, sabores con +5, día de entrega y forma de pago.",
      "Sabores y clientes.",
      "La app en español, con los colores y el logo de Amai Mochi.",
    ],
  },
];

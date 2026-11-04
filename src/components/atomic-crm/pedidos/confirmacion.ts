import type { PedidoLista } from "../types";
import { fromIsoDate } from "./fechaEntrega";
import { formatoDinero, formatoFecha } from "./formatoPedido";

type Translate = (key: string, options?: Record<string, unknown>) => string;

// The WhatsApp message that confirms an order to the client: each flavor with
// its pieces, the total, the delivery day and how they will pay. Plain text
// with line breaks, as WhatsApp shows it.
export const mensajeConfirmacion = (
  pedido: PedidoLista,
  translate: Translate,
  locale: string,
): string => {
  const total =
    pedido.total > 0
      ? translate("amai.orders.confirm.total", {
          smart_count: pedido.piezas,
          total: formatoDinero(pedido.total),
        })
      : translate("amai.orders.confirm.total_no_price", {
          smart_count: pedido.piezas,
        });
  const lineas = [
    translate("amai.orders.confirm.greeting", { name: pedido.cliente }),
    ...pedido.sabores.map((sabor) => `• ${sabor.nombre}: ${sabor.cantidad}`),
    total,
    translate("amai.orders.confirm.delivery", {
      date: formatoFecha(fromIsoDate(pedido.fecha_entrega), locale),
    }),
  ];
  if (pedido.metodo_pago) {
    lineas.push(
      translate("amai.orders.confirm.payment", {
        method: translate(`amai.orders.payment_methods.${pedido.metodo_pago}`, {
          _: pedido.metodo_pago,
        }).toLowerCase(),
      }),
    );
  }
  lineas.push(translate("amai.orders.confirm.thanks"));
  return lineas.join("\n");
};

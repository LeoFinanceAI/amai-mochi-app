import type { TranslateFunction } from "ra-core";

import { whatsappUrl } from "../amai/whatsapp";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { DeudaCliente } from "./cobranza";

// The WhatsApp link with the payment reminder already written; null when the
// client has no phone.
export const enlaceRecordatorio = (
  deuda: DeudaCliente,
  translate: TranslateFunction,
): string | null =>
  whatsappUrl(
    deuda.telefono,
    translate("amai.receivables.reminder", {
      name: deuda.nombre,
      total: formatoDinero(deuda.total),
      smart_count: deuda.pedidos.length,
    }),
  );

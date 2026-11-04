import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useNotify, useUpdate } from "ra-core";
import { useState } from "react";

import type { EstadoPedido, Pago, PedidoLista } from "../types";

const AVISO_ESTADO: Record<EstadoPedido, string> = {
  entregado: "amai.orders.notice.delivered",
  cancelado: "amai.orders.notice.cancelled",
  pendiente: "amai.orders.notice.pending",
};

const ALL = {
  pagination: { page: 1, perPage: 100 },
  sort: { field: "id", order: "ASC" as const },
};

export interface CambioConPago {
  estado: EstadoPedido;
  pagos: Pago[];
  monto: number;
}

// Changes an order's state. An order that was paid cannot leave "entregado"
// with its payment still counted, so that change first asks (porConfirmar)
// and then removes the payment before the state; the payment goes first so a
// failure halfway leaves the order delivered and unpaid, never "pending but
// collected". Changes with no payment can be undone for a few seconds.
export const useCambiarEstado = (pedido: PedidoLista) => {
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const [update, { isPending: isUpdating }] = useUpdate<PedidoLista>();
  const [porConfirmar, setPorConfirmar] = useState<CambioConPago | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const sinPago = (estado: EstadoPedido) =>
    update(
      "pedido",
      { id: pedido.id, data: { estado }, previousData: pedido },
      {
        mutationMode: "undoable",
        onSuccess: () =>
          notify(AVISO_ESTADO[estado], { type: "info", undoable: true }),
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );

  const cambiar = async (estado: EstadoPedido) => {
    if (pedido.estado !== "entregado") {
      sinPago(estado);
      return;
    }
    setIsWorking(true);
    try {
      const { data: pagos } = await dataProvider.getList<Pago>("pago", {
        ...ALL,
        filter: { pedido_id: pedido.id },
      });
      if (pagos.length) {
        const monto = pagos.reduce((total, p) => total + Number(p.monto), 0);
        setPorConfirmar({ estado, pagos, monto });
      } else {
        sinPago(estado);
      }
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      setIsWorking(false);
    }
  };

  const confirmarCambio = async () => {
    if (!porConfirmar) return;
    setIsWorking(true);
    try {
      for (const pago of porConfirmar.pagos) {
        await dataProvider.delete("pago", { id: pago.id, previousData: pago });
      }
      await dataProvider.update("pedido", {
        id: pedido.id,
        data: { estado: porConfirmar.estado },
        previousData: pedido,
      });
      notify(AVISO_ESTADO[porConfirmar.estado], { type: "info" });
      setPorConfirmar(null);
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      for (const key of ["pedido", "pago", "v_cobranza_pendiente"]) {
        await queryClient.invalidateQueries({ queryKey: [key] });
      }
      setIsWorking(false);
    }
  };

  return {
    cambiar,
    porConfirmar,
    confirmarCambio,
    descartar: () => setPorConfirmar(null),
    isPending: isUpdating || isWorking,
  };
};

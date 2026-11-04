import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import type { Pago, PedidoLista } from "../types";
import { formatoDinero } from "./formatoPedido";

export interface VentaHecha {
  pedidoId: number;
  piezas: number;
  total: number;
}

const ALL = {
  pagination: { page: 1, perPage: 100 },
  sort: { field: "id", order: "ASC" as const },
};

// The quick sales made on this screen, newest first, each with "Deshacer":
// it removes the sale's payment and then cancels the order, so it stops
// counting as sold and as collected. Payment first: if the second step fails,
// the sale is left unpaid in "Por cobrar", never cancelled but still collected.
export const VentasRecientes = ({
  ventas,
  onDeshecha,
}: {
  ventas: ReadonlyArray<VentaHecha>;
  onDeshecha: (pedidoId: number) => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const deshacer = async (venta: VentaHecha) => {
    setIsSaving(true);
    try {
      const { data: pagos } = await dataProvider.getList<Pago>("pago", {
        ...ALL,
        filter: { pedido_id: venta.pedidoId },
      });
      for (const pago of pagos) {
        await dataProvider.delete("pago", { id: pago.id, previousData: pago });
      }
      const { data: pedido } = await dataProvider.getOne<PedidoLista>(
        "pedido",
        { id: venta.pedidoId },
      );
      await dataProvider.update("pedido", {
        id: venta.pedidoId,
        data: { estado: "cancelado" },
        previousData: pedido,
      });
      onDeshecha(venta.pedidoId);
      notify("amai.quick_sale.undone", { type: "info" });
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      for (const key of ["pedido", "pago", "v_cliente_actividad"]) {
        await queryClient.invalidateQueries({ queryKey: [key] });
      }
      setIsSaving(false);
    }
  };

  if (!ventas.length) return null;
  return (
    <section
      aria-label={translate("amai.quick_sale.recent")}
      className="flex flex-col gap-2"
    >
      <h2 className="text-2xl">{translate("amai.quick_sale.recent")}</h2>
      <ul className="flex flex-col gap-2">
        {ventas.map((venta) => (
          <li
            key={venta.pedidoId}
            className="flex items-center justify-between gap-2 rounded-xl border bg-card pl-4 pr-2 min-h-14"
          >
            <span className="font-semibold">
              {translate("amai.orders.pieces", { smart_count: venta.piezas })}
              {venta.total > 0 ? ` · ${formatoDinero(venta.total)}` : null}
            </span>
            <Button
              variant="ghost"
              className="min-h-11"
              disabled={isSaving}
              onClick={() => deshacer(venta)}
            >
              {translate("ra.action.undo")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};

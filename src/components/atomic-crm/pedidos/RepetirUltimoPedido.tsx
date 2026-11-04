import { useGetList, useLocaleState, useTranslate } from "ra-core";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { PedidoLista, Sabor } from "../types";
import { fromIsoDate } from "./fechaEntrega";
import type { NuevoPedidoForm } from "./nuevoPedidoForm";

interface RepetirUltimoPedidoProps {
  clienteId: string;
  onRepetir: (cambio: Partial<NuevoPedidoForm>) => void;
}

// Distributors tend to order about the same each time: offer to fill the form
// with the client's last (not cancelled) order, so only the differences need
// tapping. Copies pieces per active flavor, payment method and location; the
// delivery day and notes are left for this order.
export const RepetirUltimoPedido = ({
  clienteId,
  onRepetir,
}: RepetirUltimoPedidoProps) => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const { data: ultimos } = useGetList<PedidoLista>("pedido", {
    filter: { cliente_id: Number(clienteId), "estado@neq": "cancelado" },
    sort: { field: "fecha_pedido", order: "DESC" },
    pagination: { page: 1, perPage: 1 },
  });
  // Same query as the flavor list: served from the cache.
  const { data: activos } = useGetList<Sabor>("sabor", {
    filter: { activo: true },
    sort: { field: "nombre", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
  });
  const ultimo = ultimos?.[0];
  if (!ultimo || !activos) return null;

  const idsActivos = new Set(activos.map((sabor) => sabor.id));
  const sabores = ultimo.sabores.filter((s) => idsActivos.has(s.sabor_id));
  if (sabores.length === 0) return null;

  const fecha = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    day: "numeric",
    month: "short",
  }).format(fromIsoDate(ultimo.fecha_entrega));
  const resumen = sabores.map((s) => `${s.nombre} ${s.cantidad}`).join(" · ");

  const repetir = () =>
    onRepetir({
      cantidades: Object.fromEntries(
        sabores.map((sabor) => [sabor.sabor_id, sabor.cantidad]),
      ),
      metodoPago:
        ultimo.metodo_pago === "transferencia" ? "transferencia" : "efectivo",
      direccion: ultimo.direccion ?? "",
    });

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed p-3">
      <p className="text-sm text-muted-foreground">
        {translate("amai.orders.repeat.last", { date: fecha })}{" "}
        <span className="text-foreground">{resumen}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 gap-2 self-start"
        onClick={repetir}
      >
        <RotateCcw className="size-4" />
        {translate("amai.orders.repeat.button")}
      </Button>
    </div>
  );
};

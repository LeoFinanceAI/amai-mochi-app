import { useNotify, useTranslate, useUpdate } from "ra-core";
import { Link } from "react-router";
import { Check, MapPin, Pencil, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { editOrderPath } from "../amai/paths";
import type { EstadoPedido, PedidoLista } from "../types";
import { formatoDinero } from "./formatoPedido";

const AVISO_ESTADO: Record<EstadoPedido, string> = {
  entregado: "amai.orders.notice.delivered",
  cancelado: "amai.orders.notice.cancelled",
  pendiente: "amai.orders.notice.pending",
};

// One order in the list: who, how many of each flavor, how much, and the
// actions for its state. State changes can be undone for a few seconds.
export const PedidoCard = ({ pedido }: { pedido: PedidoLista }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [update, { isPending }] = useUpdate<PedidoLista>();

  const cambiarEstado = (estado: EstadoPedido) =>
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

  const detalle = [
    translate("amai.orders.pieces", { smart_count: pedido.piezas }),
    pedido.total > 0
      ? formatoDinero(pedido.total)
      : translate("amai.orders.no_price"),
    pedido.metodo_pago
      ? translate(`amai.orders.payment_methods.${pedido.metodo_pago}`, {
          _: pedido.metodo_pago,
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-4",
        pedido.estado === "cancelado" && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">
            {[pedido.cliente, pedido.zona].filter(Boolean).join(" · ")}
          </span>
          <span className="text-sm text-muted-foreground">{detalle}</span>
        </div>
        {pedido.estado === "pendiente" ? null : (
          <Badge
            variant={pedido.estado === "entregado" ? "default" : "outline"}
          >
            {translate(`amai.orders.states.${pedido.estado}`)}
          </Badge>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {pedido.sabores.map((sabor) => (
          <li key={sabor.sabor_id} className="flex items-center gap-1">
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{ background: sabor.color }}
            />
            {sabor.nombre} {sabor.cantidad}
          </li>
        ))}
      </ul>
      {pedido.direccion ? (
        <p className="flex items-start gap-1 text-sm break-words">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          {pedido.direccion}
        </p>
      ) : null}
      {pedido.notas ? (
        <p className="text-sm text-muted-foreground break-words">
          {pedido.notas}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        {pedido.estado === "pendiente" ? (
          <>
            <Button
              className="min-h-11 grow gap-1"
              disabled={isPending}
              onClick={() => cambiarEstado("entregado")}
            >
              <Check className="size-4" />
              {translate("amai.orders.actions.deliver")}
            </Button>
            <Link
              to={editOrderPath(pedido.id)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 gap-1",
              )}
            >
              <Pencil className="size-4" />
              {translate("amai.orders.actions.edit")}
            </Link>
            <Button
              variant="ghost"
              className="min-h-11 gap-1"
              disabled={isPending}
              onClick={() => cambiarEstado("cancelado")}
            >
              <X className="size-4" />
              {translate("amai.orders.actions.cancel")}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="min-h-11 gap-1"
            disabled={isPending}
            onClick={() => cambiarEstado("pendiente")}
          >
            <RotateCcw className="size-4" />
            {translate("amai.orders.actions.back_to_pending")}
          </Button>
        )}
      </div>
    </li>
  );
};

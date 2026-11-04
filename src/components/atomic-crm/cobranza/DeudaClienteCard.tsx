import { useLocaleState, useTranslate } from "ra-core";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { fromIsoDate } from "../pedidos/fechaEntrega";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { MetodoPago } from "../types";
import { DIAS_ALERTA, type DeudaCliente } from "./cobranza";
import { enlaceRecordatorio } from "./recordatorio";

const METODOS: ReadonlyArray<MetodoPago> = ["efectivo", "transferencia"];

interface DeudaClienteCardProps {
  deuda: DeudaCliente;
  isSaving: boolean;
  onPagar: (deuda: DeudaCliente, metodo: MetodoPago) => void;
}

const fechaCorta = (fecha: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(fromIsoDate(fecha));

// A client who owes: total, each unpaid order with its days, "Recordar" by
// WhatsApp and "Registrar pago" (cash or transfer) for all their orders.
export const DeudaClienteCard = ({
  deuda,
  isSaving,
  onPagar,
}: DeudaClienteCardProps) => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const [eligiendoMetodo, setEligiendoMetodo] = useState(false);
  const [recordado, setRecordado] = useState(false);
  const total = deuda.tieneSinPrecio
    ? translate("amai.orders.no_price")
    : formatoDinero(deuda.total);
  const recordar = enlaceRecordatorio(deuda, translate);

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{deuda.nombre}</span>
          {deuda.zona ? (
            <span className="text-sm text-muted-foreground">{deuda.zona}</span>
          ) : null}
        </div>
        <span className="text-lg font-bold tabular-nums">{total}</span>
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {deuda.pedidos.map((pedido) => (
          <li key={pedido.id} className="flex justify-between gap-2">
            <span className="first-letter:uppercase">
              {translate("amai.receivables.order_line", {
                date: fechaCorta(pedido.fecha_entrega, locale),
                pieces: pedido.piezas,
              })}
            </span>
            <span
              className={cn(
                pedido.dias > DIAS_ALERTA
                  ? "font-bold text-meta-pendiente-text"
                  : "text-muted-foreground",
              )}
            >
              {pedido.dias <= 0
                ? translate("amai.receivables.delivered_today")
                : translate("amai.receivables.days_ago", {
                    smart_count: pedido.dias,
                  })}
            </span>
          </li>
        ))}
      </ul>
      {eligiendoMetodo ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            {translate("amai.receivables.how_paid")}
          </span>
          <div className="flex gap-2">
            {METODOS.map((metodo) => (
              <Button
                key={metodo}
                className="min-h-11 grow"
                disabled={isSaving}
                onClick={() => onPagar(deuda, metodo)}
              >
                {translate(`amai.orders.payment_methods.${metodo}`)}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setEligiendoMetodo(false)}
            >
              {translate("ra.action.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {recordar ? (
            <a
              href={recordar}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setRecordado(true)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 gap-1",
                recordado && "border-meta-ok text-meta-ok-text",
              )}
            >
              <MessageCircle className="size-4" />
              {translate(
                recordado
                  ? "amai.receivables.reminded"
                  : "amai.receivables.remind",
              )}
            </a>
          ) : (
            <span className="self-center text-xs text-muted-foreground">
              {translate("amai.receivables.no_phone")}
            </span>
          )}
          <Button
            className="min-h-11 grow"
            disabled={deuda.tieneSinPrecio || isSaving}
            onClick={() => setEligiendoMetodo(true)}
          >
            {translate("amai.receivables.register_payment")}
          </Button>
        </div>
      )}
      {deuda.tieneSinPrecio ? (
        <p className="text-xs text-muted-foreground">
          {translate("amai.receivables.no_price_hint")}
        </p>
      ) : null}
    </li>
  );
};

import { useTranslate } from "ra-core";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatoDinero } from "../pedidos/formatoPedido";
import { DIAS_ALERTA, estaVencido, type DeudaCliente } from "./cobranza";
import { enlaceRecordatorio } from "./recordatorio";

interface Pendiente {
  deuda: DeudaCliente;
  enlace: string;
}

// "Recordar a todos": goes through the clients with orders older than 7 days,
// one WhatsApp at a time (a browser cannot open several chats at once). Sending
// one shows the next; clients with no phone are left out.
export const RecordarATodos = ({
  deudas,
}: {
  deudas: ReadonlyArray<DeudaCliente>;
}) => {
  const translate = useTranslate();
  // The list is fixed when the round starts, so paying someone meanwhile does
  // not shift the others.
  const [ronda, setRonda] = useState<Pendiente[] | null>(null);
  const [actual, setActual] = useState(0);
  const [enviados, setEnviados] = useState(0);

  const pendientes = deudas.filter(estaVencido).flatMap((deuda) => {
    const enlace = enlaceRecordatorio(deuda, translate);
    return enlace ? [{ deuda, enlace }] : [];
  });

  if (!ronda) {
    if (!pendientes.length) return null;
    return (
      <Button
        variant="outline"
        className="min-h-11 gap-2"
        onClick={() => {
          setRonda(pendientes);
          setActual(0);
          setEnviados(0);
        }}
      >
        <MessageCircle className="size-4" />
        {translate("amai.receivables.bulk.start", {
          smart_count: pendientes.length,
          days: DIAS_ALERTA,
        })}
      </Button>
    );
  }

  const siguiente = ronda[actual];
  return (
    <section
      aria-label={translate("amai.receivables.bulk.title")}
      className="flex flex-col gap-3 rounded-xl border-2 border-primary bg-card p-4"
    >
      {siguiente ? (
        <>
          <p className="text-sm text-muted-foreground">
            {translate("amai.receivables.bulk.progress", {
              current: actual + 1,
              total: ronda.length,
            })}
          </p>
          <p className="flex justify-between gap-2">
            <span className="truncate font-semibold">
              {siguiente.deuda.nombre}
            </span>
            <span className="font-bold tabular-nums">
              {formatoDinero(siguiente.deuda.total)}
            </span>
          </p>
          <a
            href={siguiente.enlace}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setEnviados((n) => n + 1);
              setActual((i) => i + 1);
            }}
            className={cn(buttonVariants(), "min-h-11 gap-2")}
          >
            <MessageCircle className="size-4" />
            {translate("amai.receivables.bulk.send", {
              name: siguiente.deuda.nombre,
            })}
          </a>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="min-h-11 grow"
              onClick={() => setActual((i) => i + 1)}
            >
              {translate("amai.receivables.bulk.skip")}
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 grow"
              onClick={() => setActual(ronda.length)}
            >
              {translate("amai.receivables.bulk.finish")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="font-semibold">
            {translate("amai.receivables.bulk.done", {
              smart_count: enviados,
              total: ronda.length,
            })}
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setRonda(null)}
          >
            {translate("ra.action.close")}
          </Button>
        </>
      )}
    </section>
  );
};

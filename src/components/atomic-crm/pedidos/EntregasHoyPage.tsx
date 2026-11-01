import { useGetList, useLocaleState, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { AMAI_PATHS } from "../amai/paths";
import type { PedidoLista } from "../types";
import { toIsoDate } from "./fechaEntrega";
import { formatoFecha } from "./formatoPedido";
import { PedidoCard } from "./PedidoCard";

const MAX_ORDERS = 200;

// Pending first, then the ones already delivered; each by client name.
const porEntregar = (a: PedidoLista, b: PedidoLista) =>
  Number(a.estado !== "pendiente") - Number(b.estado !== "pendiente") ||
  a.cliente.localeCompare(b.cliente, "es");

// "Entregas de hoy": today's deliveries with their address (tap for Maps),
// plus pending orders whose day already passed. "Today" is the phone's date.
export const EntregasHoyPage = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const hoy = new Date();
  const fechaHoy = toIsoDate(hoy);
  const params = {
    sort: { field: "id", order: "ASC" },
    pagination: { page: 1, perPage: MAX_ORDERS },
  } as const;
  const deHoy = useGetList<PedidoLista>("pedido", {
    ...params,
    filter: { fecha_entrega: fechaHoy, "estado@neq": "cancelado" },
  });
  const atrasados = useGetList<PedidoLista>("pedido", {
    ...params,
    filter: { estado: "pendiente", "fecha_entrega@lt": fechaHoy },
  });

  const isPending = deHoy.isPending || atrasados.isPending;
  const hasError = deHoy.error || atrasados.error;
  const pedidosHoy = [...(deHoy.data ?? [])].sort(porEntregar);
  const entregados = pedidosHoy.filter((p) => p.estado === "entregado").length;
  const piezasPorEntregar = pedidosHoy
    .filter((p) => p.estado === "pendiente")
    .reduce((total, p) => total + p.piezas, 0);

  return (
    <AmaiPage title={translate("amai.deliveries.title")}>
      <p className="-mt-2 text-muted-foreground first-letter:uppercase">
        {formatoFecha(hoy, locale)}
      </p>
      {isPending ? <Skeleton className="h-40 w-full" /> : null}
      {hasError ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {!isPending && !hasError ? (
        <>
          {pedidosHoy.length ? (
            <p className="font-semibold" aria-live="polite">
              {translate("amai.deliveries.progress", {
                done: entregados,
                total: pedidosHoy.length,
                pieces: piezasPorEntregar,
              })}
            </p>
          ) : null}
          {atrasados.data?.length ? (
            <Seccion
              titulo={translate("amai.deliveries.overdue")}
              pedidos={atrasados.data}
            />
          ) : null}
          {pedidosHoy.length ? (
            <Seccion
              titulo={translate("amai.orders.days.today")}
              pedidos={pedidosHoy}
            />
          ) : (
            <p className="text-muted-foreground">
              {translate("amai.deliveries.empty")}
            </p>
          )}
        </>
      ) : null}
      <Link
        to={AMAI_PATHS.orders}
        className="inline-flex min-h-11 items-center self-start font-semibold text-primary"
      >
        {translate("amai.deliveries.all_orders")}
      </Link>
    </AmaiPage>
  );
};

const Seccion = ({
  titulo,
  pedidos,
}: {
  titulo: string;
  pedidos: PedidoLista[];
}) => (
  <section aria-label={titulo} className="flex flex-col gap-2">
    <h2 className="text-2xl">{titulo}</h2>
    <ul className="flex flex-col gap-3">
      {pedidos.map((pedido) => (
        <PedidoCard key={pedido.id} pedido={pedido} />
      ))}
    </ul>
  </section>
);

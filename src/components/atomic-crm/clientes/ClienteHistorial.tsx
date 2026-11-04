import { useQuery } from "@tanstack/react-query";
import {
  useDataProvider,
  useGetList,
  useLocaleState,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { fromIsoDate } from "../pedidos/fechaEntrega";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { CrmDataProvider } from "../providers/types";
import type { Cliente, PedidoLista } from "../types";

const ULTIMOS = 10;

// A client's history on their page: what they bought (delivered orders), what
// they still owe (from v_saldo_cliente) and their latest orders.
export const ClienteHistorial = () => {
  const translate = useTranslate();
  const cliente = useRecordContext<Cliente>();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const clienteId = cliente?.id;

  const saldo = useQuery({
    queryKey: ["saldo_cliente", clienteId],
    queryFn: () => dataProvider.saldoCliente(clienteId!),
    enabled: clienteId != null,
  });
  const pedidos = useGetList<PedidoLista>(
    "pedido",
    {
      filter: { cliente_id: clienteId, "estado@neq": "cancelado" },
      sort: { field: "fecha_entrega", order: "DESC" },
      pagination: { page: 1, perPage: ULTIMOS },
    },
    { enabled: clienteId != null },
  );

  if (saldo.isPending || pedidos.isPending) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (saldo.error || pedidos.error) {
    return (
      <p className="text-destructive" role="alert">
        {translate("ra.notification.http_error")}
      </p>
    );
  }

  return (
    <section
      aria-label={translate("amai.clients.history.title")}
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-3 gap-2">
        <Dato
          titulo={translate("amai.clients.history.bought")}
          valor={formatoDinero(saldo.data.cargos)}
        />
        <Dato
          titulo={translate("amai.clients.history.orders")}
          valor={String(pedidos.total ?? 0)}
        />
        <Dato
          titulo={translate("amai.clients.history.owes")}
          valor={formatoDinero(Math.max(0, saldo.data.saldo))}
          destacado={saldo.data.saldo > 0}
        />
      </div>
      <h2 className="text-2xl">{translate("amai.clients.history.latest")}</h2>
      {pedidos.data.length ? (
        <ul className="flex flex-col gap-2">
          {pedidos.data.map((pedido) => (
            <PedidoResumen key={pedido.id} pedido={pedido} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          {translate("amai.clients.history.none")}
        </p>
      )}
    </section>
  );
};

const Dato = ({
  titulo,
  valor,
  destacado = false,
}: {
  titulo: string;
  valor: string;
  destacado?: boolean;
}) => (
  <div className="rounded-xl border bg-card p-3">
    <p className="text-xs text-muted-foreground">{titulo}</p>
    <p
      className={cn(
        "text-lg font-bold tabular-nums",
        destacado && "text-meta-pendiente-text",
      )}
    >
      {valor}
    </p>
  </div>
);

const PedidoResumen = ({ pedido }: { pedido: PedidoLista }) => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const fecha = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fromIsoDate(pedido.fecha_entrega));
  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold">{fecha}</span>
        <span className="truncate text-sm text-muted-foreground">
          {pedido.sabores.map((s) => `${s.nombre} ${s.cantidad}`).join(" · ")}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="font-bold tabular-nums">
          {pedido.total > 0
            ? formatoDinero(pedido.total)
            : translate("amai.orders.pieces", { smart_count: pedido.piezas })}
        </span>
        <span className="text-xs text-muted-foreground">
          {translate(`amai.orders.states.${pedido.estado}`)}
        </span>
      </div>
    </li>
  );
};

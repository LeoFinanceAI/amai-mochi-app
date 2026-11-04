import { useGetList, useTranslate } from "ra-core";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AmaiPage } from "../amai/AmaiPage";
import { whatsappUrl } from "../amai/whatsapp";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { ClienteActividad } from "../types";

const TOP = 5;
// A distributor with no order in this many days is worth a message.
const DIAS_SIN_PEDIR = 30;
const MAX_ROWS = 100;

// "Tus clientes": who buys the most in the last 90 days and which distributors
// have not ordered in a while, from v_cliente_actividad. "Público en general"
// is left out of both.
export const TusClientesPage = () => {
  const translate = useTranslate();
  const top = useGetList<ClienteActividad>("v_cliente_actividad", {
    filter: { "tipo@neq": "publico", "total_90_dias@gt": 0 },
    sort: { field: "total_90_dias", order: "DESC" },
    pagination: { page: 1, perPage: TOP },
  });
  const dormidos = useGetList<ClienteActividad>("v_cliente_actividad", {
    filter: {
      tipo: "distribuidor",
      activo: true,
      "dias_sin_pedir@gt": DIAS_SIN_PEDIR,
    },
    sort: { field: "dias_sin_pedir", order: "DESC" },
    pagination: { page: 1, perPage: MAX_ROWS },
  });

  return (
    <AmaiPage title={translate("amai.customers.title")}>
      <Seccion
        titulo={translate("amai.customers.top")}
        consulta={top}
        vacio={translate("amai.customers.top_empty")}
      >
        {(cliente, lugar) => (
          <li
            key={cliente.id}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
          >
            <span className="text-2xl text-primary tabular-nums">
              {lugar + 1}
            </span>
            <Link
              to={`/cliente/${cliente.id}`}
              className="flex min-w-0 flex-1 flex-col"
            >
              <span className="truncate font-semibold">{cliente.nombre}</span>
              <span className="text-sm text-muted-foreground">
                {[cliente.zona, ultimoPedido(cliente, translate)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
            <span className="font-bold tabular-nums">
              {formatoDinero(cliente.total_90_dias)}
            </span>
          </li>
        )}
      </Seccion>
      <Seccion
        titulo={translate("amai.customers.quiet", { days: DIAS_SIN_PEDIR })}
        consulta={dormidos}
        vacio={translate("amai.customers.quiet_empty", {
          days: DIAS_SIN_PEDIR,
        })}
      >
        {(cliente) => <ClienteDormido key={cliente.id} cliente={cliente} />}
      </Seccion>
    </AmaiPage>
  );
};

type TranslateFn = ReturnType<typeof useTranslate>;

const ultimoPedido = (cliente: ClienteActividad, translate: TranslateFn) =>
  cliente.dias_sin_pedir == null
    ? null
    : cliente.dias_sin_pedir <= 0
      ? translate("amai.customers.ordered_today")
      : translate("amai.customers.last_order", {
          smart_count: cliente.dias_sin_pedir,
        });

interface SeccionProps {
  titulo: string;
  consulta: ReturnType<typeof useGetList<ClienteActividad>>;
  vacio: string;
  children: (cliente: ClienteActividad, lugar: number) => React.ReactNode;
}

const Seccion = ({ titulo, consulta, vacio, children }: SeccionProps) => {
  const translate = useTranslate();
  return (
    <section aria-label={titulo} className="flex flex-col gap-2">
      <h2 className="text-2xl">{titulo}</h2>
      {consulta.isPending ? <Skeleton className="h-32 w-full" /> : null}
      {consulta.error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {consulta.data?.length ? (
        <ul className="flex flex-col gap-2">{consulta.data.map(children)}</ul>
      ) : consulta.data ? (
        <p className="text-muted-foreground">{vacio}</p>
      ) : null}
    </section>
  );
};

const ClienteDormido = ({ cliente }: { cliente: ClienteActividad }) => {
  const translate = useTranslate();
  const enlace = whatsappUrl(
    cliente.telefono,
    translate("amai.customers.message", { name: cliente.nombre }),
  );
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Link
        to={`/cliente/${cliente.id}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        <span className="truncate font-semibold">{cliente.nombre}</span>
        <span className="text-sm font-semibold text-meta-pendiente-text">
          {ultimoPedido(cliente, translate)}
        </span>
      </Link>
      {enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "min-h-11 shrink-0 gap-1",
          )}
        >
          <MessageCircle className="size-4" />
          {translate("amai.customers.write")}
        </a>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">
          {translate("amai.customers.no_phone")}
        </span>
      )}
    </li>
  );
};

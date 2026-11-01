import { ListBase, useListContext, useTranslate } from "ra-core";
import { Link } from "react-router";
import { ChevronRight, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { CatalogPage } from "../amai/CatalogPage";
import type { Cliente } from "../types";

// ~5 distributors plus public and event buyers: one screen, no pagination.
const ALL_CLIENTS = 200;

export const ClienteList = () => {
  const translate = useTranslate();
  return (
    <ListBase<Cliente>
      resource="cliente"
      sort={{ field: "nombre", order: "ASC" }}
      perPage={ALL_CLIENTS}
    >
      <CatalogPage
        title={translate("resources.cliente.name", { smart_count: 2 })}
      >
        <Link
          to="/cliente/create"
          className={cn(buttonVariants(), "min-h-11 self-start gap-2")}
        >
          <Plus className="size-5" />
          {translate("amai.clients.add")}
        </Link>
        <ClienteRows />
      </CatalogPage>
    </ListBase>
  );
};

// Active clients first, then inactive ones, each alphabetically.
const byActiveThenName = (a: Cliente, b: Cliente) =>
  Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, "es");

const ClienteRows = () => {
  const translate = useTranslate();
  const { data, isPending, error } = useListContext<Cliente>();

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="mt-4 text-destructive" role="alert">
        {translate("ra.notification.http_error")}
      </p>
    );
  }
  if (!data?.length) {
    return (
      <p className="mt-4 text-muted-foreground">
        {translate("amai.clients.empty")}
      </p>
    );
  }
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {[...data].sort(byActiveThenName).map((cliente) => (
        <ClienteRow key={cliente.id} cliente={cliente} />
      ))}
    </ul>
  );
};

const ClienteRow = ({ cliente }: { cliente: Cliente }) => {
  const translate = useTranslate();
  const details = [
    translate(`resources.cliente.tipos.${cliente.tipo}`),
    cliente.zona,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={cn(!cliente.activo && "opacity-60")}>
      <Link
        to={`/cliente/${cliente.id}`}
        className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-14"
      >
        <div className="flex flex-1 min-w-0 flex-col">
          <span className="truncate font-semibold">
            {cliente.nombre}
            {cliente.activo ? null : (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {translate("amai.clients.inactive")}
              </span>
            )}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {details}
          </span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
};

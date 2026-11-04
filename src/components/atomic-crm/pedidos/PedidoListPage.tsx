import { useGetList, useLocaleState, useTranslate } from "ra-core";
import { useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { ChefHat, Plus, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import { AMAI_PATHS } from "../amai/paths";
import type { PedidoLista } from "../types";
import { diasDesdeHoy, fromIsoDate } from "./fechaEntrega";
import { formatoFecha } from "./formatoPedido";
import { BuscarPedidos } from "./BuscarPedidos";
import { PedidoCard } from "./PedidoCard";

const FILTROS = ["pendiente", "entregado", "cancelado", "todos"] as const;
type Filtro = (typeof FILTROS)[number];

const isFiltro = (value: string | null): value is Filtro =>
  FILTROS.includes(value as Filtro);

// A few weeks of orders fit on one screen; no pagination for the MVP.
const MAX_ORDERS = 200;

const DAY_LABELS: Record<number, string> = {
  [-1]: "amai.orders.days.yesterday",
  0: "amai.orders.days.today",
  1: "amai.orders.days.tomorrow",
};

// Orders grouped by delivery date. Pending ones (the default) go from the
// most overdue to the latest; the others, newest first. The chosen filter
// and the search live in the URL (?estado=...&q=...&fecha=...), so back and
// refresh keep them.
export const PedidoListPage = () => {
  const translate = useTranslate();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("estado");
  const filtro: Filtro = isFiltro(param) ? param : "pendiente";
  const texto = searchParams.get("q") ?? "";
  const fecha = searchParams.get("fecha") ?? "";

  // Replaces some URL params, dropping the empty ones.
  const cambiarParams = useCallback(
    (cambios: Record<string, string>) =>
      setSearchParams(
        (actuales) => {
          const nuevos = new URLSearchParams(actuales);
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor) nuevos.set(clave, valor);
            else nuevos.delete(clave);
          }
          return nuevos;
        },
        { replace: true },
      ),
    [setSearchParams],
  );
  const buscar = useCallback(
    (cambio: { texto?: string; fecha?: string }) =>
      cambiarParams({
        ...(cambio.texto !== undefined ? { q: cambio.texto.trim() } : {}),
        ...(cambio.fecha !== undefined ? { fecha: cambio.fecha } : {}),
      }),
    [cambiarParams],
  );

  const { data, isPending, error } = useGetList<PedidoLista>("pedido", {
    filter: {
      ...(filtro === "todos" ? {} : { estado: filtro }),
      ...(texto ? { "cliente@ilike": texto } : {}),
      ...(fecha ? { fecha_entrega: fecha } : {}),
    },
    sort: {
      field: "fecha_entrega",
      order: filtro === "pendiente" ? "ASC" : "DESC",
    },
    pagination: { page: 1, perPage: MAX_ORDERS },
  });

  return (
    <AmaiPage title={translate("amai.navigation.orders")}>
      <div className="flex flex-wrap gap-2">
        <Link
          to={AMAI_PATHS.newOrder}
          className={cn(buttonVariants(), "min-h-11 gap-2")}
        >
          <Plus className="size-5" />
          {translate("amai.navigation.new_order")}
        </Link>
        <Link
          to={AMAI_PATHS.deliveriesToday}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "min-h-11 gap-2",
          )}
        >
          <Truck className="size-5" />
          {translate("amai.deliveries.title")}
        </Link>
        <Link
          to={AMAI_PATHS.production}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "min-h-11 gap-2",
          )}
        >
          <ChefHat className="size-5" />
          {translate("amai.production.title")}
        </Link>
      </div>
      <ChipRadioGroup
        legend={translate("amai.orders.filter")}
        name="estado"
        options={FILTROS.map((value) => ({
          value,
          label: translate(`amai.orders.filters.${value}`),
        }))}
        value={filtro}
        onChange={(estado) => cambiarParams({ estado })}
      />
      <BuscarPedidos texto={texto} fecha={fecha} onChange={buscar} />
      {isPending ? <Skeleton className="h-40 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {data?.length === 0 ? (
        <p className="text-muted-foreground">
          {translate(
            texto || fecha ? "amai.orders.search.none" : "amai.orders.empty",
          )}
        </p>
      ) : null}
      {data?.length ? <GruposPorFecha pedidos={data} /> : null}
    </AmaiPage>
  );
};

const agruparPorFecha = (pedidos: PedidoLista[]) =>
  pedidos.reduce<Array<{ fecha: string; pedidos: PedidoLista[] }>>(
    (grupos, pedido) => {
      const ultimo = grupos.at(-1);
      return ultimo?.fecha === pedido.fecha_entrega
        ? [
            ...grupos.slice(0, -1),
            { ...ultimo, pedidos: [...ultimo.pedidos, pedido] },
          ]
        : [...grupos, { fecha: pedido.fecha_entrega, pedidos: [pedido] }];
    },
    [],
  );

const GruposPorFecha = ({ pedidos }: { pedidos: PedidoLista[] }) => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  return (
    <div className="flex flex-col gap-6">
      {agruparPorFecha(pedidos).map(({ fecha, pedidos: delDia }) => {
        const dias = diasDesdeHoy(fecha);
        const etiqueta =
          dias in DAY_LABELS
            ? translate(DAY_LABELS[dias])
            : formatoFecha(fromIsoDate(fecha), locale);
        return (
          <section
            key={fecha}
            aria-label={etiqueta}
            className="flex flex-col gap-2"
          >
            <h2 className="text-2xl">{etiqueta}</h2>
            <ul className="flex flex-col gap-3">
              {delDia.map((pedido) => (
                <PedidoCard key={pedido.id} pedido={pedido} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

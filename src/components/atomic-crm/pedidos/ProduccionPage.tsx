import { useGetList, useLocaleState, useTranslate } from "ra-core";
import { useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import type { PedidoLista } from "../types";
import { fromIsoDate, toIsoDate } from "./fechaEntrega";
import { formatoFecha } from "./formatoPedido";
import { piezasPorSabor } from "./produccion";

const DIAS = { hoy: 0, manana: 1, pasado: 2 } as const;
type Dia = keyof typeof DIAS;

const isDia = (value: string | null): value is Dia =>
  value != null && value in DIAS;

const MAX_ORDERS = 200;

// "Producción": how many pieces of each flavor to prepare for the pending
// orders of a day (tomorrow by default), instead of adding them up order by
// order. The chosen day lives in the address (?dia=hoy|manana|pasado).
export const ProduccionPage = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("dia");
  const dia: Dia = isDia(param) ? param : "manana";
  const hoy = new Date();
  const fecha = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() + DIAS[dia],
  );

  const { data, isPending, error } = useGetList<PedidoLista>("pedido", {
    filter: { estado: "pendiente", fecha_entrega: toIsoDate(fecha) },
    sort: { field: "id", order: "ASC" },
    pagination: { page: 1, perPage: MAX_ORDERS },
  });
  const sabores = piezasPorSabor(data ?? []);
  const total = sabores.reduce((suma, sabor) => suma + sabor.piezas, 0);
  const maximo = Math.max(1, ...sabores.map((sabor) => sabor.piezas));

  return (
    <AmaiPage title={translate("amai.production.title")}>
      <ChipRadioGroup
        legend={translate("amai.production.for")}
        name="dia"
        options={(Object.keys(DIAS) as Dia[]).map((value) => ({
          value,
          label: translate(`amai.production.days.${value}`),
        }))}
        value={dia}
        onChange={(nuevo) => setSearchParams({ dia: nuevo }, { replace: true })}
      />
      <p className="-mt-2 text-sm text-muted-foreground first-letter:uppercase">
        {formatoFecha(fromIsoDate(toIsoDate(fecha)), locale)}
      </p>
      {isPending ? <Skeleton className="h-40 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {data && sabores.length === 0 ? (
        <p className="text-muted-foreground">
          {translate("amai.production.empty")}
        </p>
      ) : null}
      {sabores.length ? (
        <>
          <p className="text-2xl font-bold" aria-live="polite">
            {translate("amai.production.total", { smart_count: total })}{" "}
            {translate("amai.production.orders", {
              smart_count: data?.length ?? 0,
            })}
          </p>
          <ul
            aria-label={translate("amai.production.per_flavor")}
            className="flex flex-col gap-2"
          >
            {sabores.map((sabor) => (
              <li
                key={sabor.saborId}
                className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="size-4 shrink-0 rounded-full"
                    style={{ background: sabor.color }}
                  />
                  <span className="flex-1 font-semibold">{sabor.nombre}</span>
                  <span className="text-xl font-bold tabular-nums">
                    {sabor.piezas}
                  </span>
                </div>
                <span aria-hidden className="h-2 rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round((sabor.piezas / maximo) * 100)}%`,
                      background: sabor.color,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </AmaiPage>
  );
};

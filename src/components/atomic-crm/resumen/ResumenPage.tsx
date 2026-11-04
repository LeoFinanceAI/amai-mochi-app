import { useQuery } from "@tanstack/react-query";
import { useDataProvider, useLocaleState, useTranslate } from "ra-core";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { AMAI_PATHS } from "../amai/paths";
import { lunesDeLaSemana } from "../gastos/gastoForm";
import { fromIsoDate } from "../pedidos/fechaEntrega";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { CrmDataProvider } from "../providers/types";
import type { ResumenSemana } from "../types";
import { PiezasPorDia, SaboresMasVendidos } from "./GraficasResumen";
import { cambioPorcentual, lunesElegido, moverSemanas } from "./semana";

// "Tu semana" from the approved mockup: sales, orders, collected vs. to
// collect, expenses and profit, pieces per day, top flavors and sales per
// client. All numbers come from resumen_semana() in SQL. The week shown lives
// in the address (?semana=YYYY-MM-DD), so Monday's look at last week is a tap.
export const ResumenPage = () => {
  const translate = useTranslate();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lunes = lunesElegido(searchParams.get("semana"));
  const esActual = lunes === lunesDeLaSemana();
  const { data, isPending, error } = useQuery({
    queryKey: ["resumen_semana", lunes],
    queryFn: () => dataProvider.resumenSemana(lunes),
  });
  const irA = (semanas: number) =>
    setSearchParams(
      { semana: moverSemanas(lunes, semanas) },
      { replace: true },
    );

  return (
    <AmaiPage title={translate("amai.summary.title")}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="size-11"
          onClick={() => irA(-1)}
          aria-label={translate("amai.summary.previous_week")}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <RangoSemana lunes={lunes} />
        <Button
          variant="outline"
          className="size-11"
          disabled={esActual}
          onClick={() => irA(1)}
          aria-label={translate("amai.summary.next_week")}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
      {isPending ? <Skeleton className="h-80 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {data ? <Resumen resumen={data} /> : null}
      <Link
        to={AMAI_PATHS.customers}
        className="inline-flex min-h-11 items-center self-start font-semibold text-primary"
      >
        {translate("amai.customers.link")} ›
      </Link>
    </AmaiPage>
  );
};

const RangoSemana = ({ lunes }: { lunes: string }) => {
  const [locale] = useLocaleState();
  const formato = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const inicio = fromIsoDate(lunes);
  const fin = fromIsoDate(moverSemanas(lunes, 1));
  fin.setDate(fin.getDate() - 1);
  return (
    <p className="flex-1 text-center text-sm font-semibold first-letter:uppercase">
      {formato.format(inicio)} – {formato.format(fin)}
    </p>
  );
};

const Resumen = ({ resumen }: { resumen: ResumenSemana }) => {
  const translate = useTranslate();
  const cambio = cambioPorcentual(
    resumen.vendido,
    resumen.vendido_semana_anterior,
  );
  const promedio = resumen.pedidos
    ? Math.round(resumen.piezas / resumen.pedidos)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Tarjeta
          titulo={translate("amai.summary.sold")}
          valor={formatoDinero(resumen.vendido)}
          detalle={
            cambio == null
              ? null
              : translate("amai.summary.vs_last_week", {
                  change: `${cambio > 0 ? "+" : ""}${cambio}%`,
                })
          }
        />
        <Tarjeta
          titulo={translate("amai.summary.orders")}
          valor={String(resumen.pedidos)}
          detalle={
            resumen.pedidos
              ? translate("amai.summary.average_pieces", {
                  smart_count: promedio,
                })
              : null
          }
        />
        <Tarjeta
          titulo={translate("amai.summary.collected")}
          valor={formatoDinero(resumen.cobrado)}
        />
        <Link
          to={AMAI_PATHS.receivables}
          className="rounded-xl border bg-card p-4 hover:bg-accent"
        >
          <p className="text-sm text-muted-foreground">
            {translate("amai.summary.to_collect")}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {formatoDinero(resumen.por_cobrar)} ›
          </p>
        </Link>
        <Tarjeta
          titulo={translate("amai.summary.expenses")}
          valor={formatoDinero(resumen.gastado)}
        />
        <Tarjeta
          titulo={translate("amai.summary.profit")}
          valor={formatoDinero(resumen.ganancia)}
          detalle={translate("amai.summary.profit_hint")}
        />
      </div>
      {resumen.piezas > 0 ? (
        <>
          <PiezasPorDia dias={resumen.por_dia} />
          <SaboresMasVendidos sabores={resumen.por_sabor} />
          <PorCliente clientes={resumen.por_cliente} />
        </>
      ) : (
        <p className="text-muted-foreground">
          {translate("amai.summary.no_sales")}
        </p>
      )}
    </div>
  );
};

interface TarjetaProps {
  titulo: string;
  valor: string;
  detalle?: string | null;
}

const Tarjeta = ({ titulo, valor, detalle }: TarjetaProps) => (
  <div className="rounded-xl border bg-card p-4">
    <p className="text-sm text-muted-foreground">{titulo}</p>
    <p className="text-2xl font-bold tabular-nums">{valor}</p>
    {detalle ? (
      <p className="text-xs text-muted-foreground">{detalle}</p>
    ) : null}
  </div>
);

const PorCliente = ({
  clientes,
}: {
  clientes: ResumenSemana["por_cliente"];
}) => {
  const translate = useTranslate();
  return (
    <section aria-labelledby="por-cliente" className="flex flex-col gap-3">
      <h2 id="por-cliente" className="text-2xl">
        {translate("amai.summary.by_client")}
      </h2>
      <ul className="flex flex-col gap-2">
        {clientes.map((cliente) => (
          <li
            key={cliente.cliente_id}
            className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 min-h-14"
          >
            <div className="flex min-w-0 flex-col py-2">
              <span className="truncate font-semibold">{cliente.nombre}</span>
              <span className="text-sm text-muted-foreground">
                {[
                  cliente.zona,
                  translate("amai.orders.pieces", {
                    smart_count: cliente.piezas,
                  }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <span className="font-bold tabular-nums">
              {formatoDinero(cliente.total)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

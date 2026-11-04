import { useTranslate } from "ra-core";
import { Link } from "react-router";

import { AMAI_PATHS } from "../amai/paths";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { ResumenMes, ResumenSemana } from "../types";
import { PiezasPorDia, SaboresMasVendidos } from "./GraficasResumen";
import { cambioPorcentual } from "./semana";

// The figures shared by the week and the month.
type ResumenComun = Omit<ResumenMes, "inicio" | "vendido_mes_anterior">;

interface CuerpoResumenProps {
  resumen: ResumenComun;
  // Sales of the period before, to compare with.
  anterior: number;
  // Translation keys: the comparison ("vs. last week") and "no sales".
  comparacion: string;
  sinVentas: string;
  // Week only: the pieces-per-day chart.
  porDia?: ResumenSemana["por_dia"];
}

// The cards, top flavors and sales per client of "Tu semana" and "Tu mes".
export const CuerpoResumen = ({
  resumen,
  anterior,
  comparacion,
  sinVentas,
  porDia,
}: CuerpoResumenProps) => {
  const translate = useTranslate();
  const cambio = cambioPorcentual(resumen.vendido, anterior);
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
              : translate(comparacion, {
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
          {porDia ? <PiezasPorDia dias={porDia} /> : null}
          <SaboresMasVendidos sabores={resumen.por_sabor} />
          <PorCliente clientes={resumen.por_cliente} />
        </>
      ) : (
        <p className="text-muted-foreground">{translate(sinVentas)}</p>
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

import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useGetList, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import { toIsoDate } from "../pedidos/fechaEntrega";
import { formatoDinero } from "../pedidos/formatoPedido";
import type { CobranzaPendiente, MetodoPago, Pago } from "../types";
import {
  DIAS_ALERTA,
  agruparPorCliente,
  estaVencido,
  type DeudaCliente,
} from "./cobranza";
import { DeudaClienteCard } from "./DeudaClienteCard";

const FILTROS = ["todos", "vencidos"] as const;
type Filtro = (typeof FILTROS)[number];

const MAX_ROWS = 500;

interface Cobro {
  clienteId: number;
  nombre: string;
  total: number;
  pagoIds: number[];
}

// "Por cobrar" from the approved mockup: what clients owe for delivered orders,
// grouped by client. Registering a payment pays all of a client's listed orders
// (one pago per order; SQL sets each amount); "Cobrado hoy" can undo it.
export const PorCobrarPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro: Filtro =
    searchParams.get("filtro") === "vencidos" ? "vencidos" : "todos";
  const [cobradosHoy, setCobradosHoy] = useState<Cobro[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isPending, error } = useGetList<CobranzaPendiente>(
    "v_cobranza_pendiente",
    {
      sort: { field: "fecha_entrega", order: "ASC" },
      pagination: { page: 1, perPage: MAX_ROWS },
    },
  );
  const deudas = agruparPorCliente(data ?? []);
  const visibles = filtro === "vencidos" ? deudas.filter(estaVencido) : deudas;
  const total = deudas.reduce((suma, d) => suma + d.total, 0);
  const pedidos = deudas.reduce((suma, d) => suma + d.pedidos.length, 0);

  const refrescar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["v_cobranza_pendiente"] }),
      queryClient.invalidateQueries({ queryKey: ["pago"] }),
    ]);

  const pagar = async (deuda: DeudaCliente, metodo: MetodoPago) => {
    setIsSaving(true);
    const pagoIds: number[] = [];
    try {
      for (const pedido of deuda.pedidos) {
        const { data: pago } = await dataProvider.create<Pago>("pago", {
          data: {
            pedido_id: pedido.pedido_id,
            metodo,
            fecha: toIsoDate(new Date()),
          },
        });
        pagoIds.push(pago.id);
      }
      notify("amai.receivables.paid", {
        type: "success",
        messageArgs: { name: deuda.nombre },
      });
    } catch {
      notify("amai.receivables.pay_error", { type: "error" });
    } finally {
      if (pagoIds.length) {
        setCobradosHoy((actual) => [
          ...actual,
          {
            clienteId: deuda.clienteId,
            nombre: deuda.nombre,
            total: deuda.total,
            pagoIds,
          },
        ]);
      }
      await refrescar();
      setIsSaving(false);
    }
  };

  const deshacer = async (cobro: Cobro) => {
    setIsSaving(true);
    try {
      for (const id of cobro.pagoIds) {
        await dataProvider.delete("pago", { id });
      }
      setCobradosHoy((actual) => actual.filter((c) => c !== cobro));
      notify("amai.receivables.undone", { type: "info" });
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      await refrescar();
      setIsSaving(false);
    }
  };

  return (
    <AmaiPage title={translate("amai.navigation.receivables")}>
      {isPending ? <Skeleton className="h-60 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {data ? (
        <>
          <section
            aria-label={translate("amai.receivables.summary")}
            className="rounded-xl bg-secondary p-4"
          >
            <p className="text-sm">
              {translate("amai.receivables.owed_total")}
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {deudas.length
                ? formatoDinero(total)
                : translate("amai.receivables.all_paid")}
            </p>
            {deudas.length ? (
              <p className="text-sm text-muted-foreground">
                {translate("amai.receivables.counts", {
                  smart_count: pedidos,
                  overdue: deudas.filter(estaVencido).length,
                  days: DIAS_ALERTA,
                })}
              </p>
            ) : null}
          </section>
          <ChipRadioGroup
            legend={translate("amai.orders.filter")}
            name="filtro"
            options={FILTROS.map((value) => ({
              value,
              label: translate(`amai.receivables.filters.${value}`, {
                days: DIAS_ALERTA,
              }),
            }))}
            value={filtro}
            onChange={(nuevo) =>
              setSearchParams(nuevo === "todos" ? {} : { filtro: nuevo }, {
                replace: true,
              })
            }
          />
          {visibles.length ? (
            <ul className="flex flex-col gap-3">
              {visibles.map((deuda) => (
                <DeudaClienteCard
                  key={deuda.clienteId}
                  deuda={deuda}
                  isSaving={isSaving}
                  onPagar={pagar}
                />
              ))}
            </ul>
          ) : deudas.length ? (
            <p className="text-muted-foreground">
              {translate("amai.receivables.none_overdue", {
                days: DIAS_ALERTA,
              })}
            </p>
          ) : null}
        </>
      ) : null}
      {cobradosHoy.length ? (
        <section
          aria-label={translate("amai.receivables.collected_today")}
          className="flex flex-col gap-2"
        >
          <h2 className="text-2xl">
            {translate("amai.receivables.collected_today")}
          </h2>
          <ul className="flex flex-col gap-2">
            {cobradosHoy.map((cobro) => (
              <li
                key={cobro.pagoIds.join("-")}
                className="flex items-center justify-between gap-2 rounded-xl border bg-card pl-4 pr-2 min-h-14"
              >
                <span className="font-semibold">
                  {cobro.nombre} · {formatoDinero(cobro.total)}
                </span>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  disabled={isSaving}
                  onClick={() => deshacer(cobro)}
                >
                  {translate("ra.action.undo")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AmaiPage>
  );
};

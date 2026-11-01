import { useGetList, useTranslate } from "ra-core";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { Sabor } from "../types";
import { MINIMO_PIEZAS, PASO_PIEZAS, totalPiezas } from "./nuevoPedidoForm";

const ALL_FLAVORS = 100;

interface SaborCantidadesProps {
  cantidades: Readonly<Record<number, number>>;
  onChange: (saborId: number, delta: number) => void;
}

// Pieces per active flavor, with − (one piece) and +5 buttons as in the mockup.
export const SaborCantidades = ({
  cantidades,
  onChange,
}: SaborCantidadesProps) => {
  const translate = useTranslate();
  const { data, isPending, error } = useGetList<Sabor>("sabor", {
    filter: { activo: true },
    sort: { field: "nombre", order: "ASC" },
    pagination: { page: 1, perPage: ALL_FLAVORS },
  });
  const total = totalPiezas(cantidades);

  return (
    <section className="flex flex-col gap-2" aria-labelledby="sabores-title">
      <div className="flex items-baseline justify-between">
        <span id="sabores-title" className="text-sm font-semibold">
          {translate("resources.sabor.name", { smart_count: 2 })}
        </span>
        <span className="text-sm text-muted-foreground">
          {translate("amai.orders.pieces", { smart_count: total })}
        </span>
      </div>
      {isPending ? <Skeleton className="h-40 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {data?.length === 0 ? (
        <p className="text-muted-foreground">
          {translate("amai.orders.no_flavors")}
        </p>
      ) : null}
      {data?.length ? (
        <ul className="flex flex-col gap-2">
          {data.map((sabor) => (
            <SaborFila
              key={sabor.id}
              sabor={sabor}
              cantidad={cantidades[sabor.id] ?? 0}
              onChange={(delta) => onChange(sabor.id, delta)}
            />
          ))}
        </ul>
      ) : null}
      <MinimoAviso total={total} />
    </section>
  );
};

interface SaborFilaProps {
  sabor: Sabor;
  cantidad: number;
  onChange: (delta: number) => void;
}

const SaborFila = ({ sabor, cantidad, onChange }: SaborFilaProps) => {
  const translate = useTranslate();
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card pl-4 pr-2 min-h-14">
      <span
        aria-hidden
        className="size-4 shrink-0 rounded-full"
        style={{ background: sabor.color }}
      />
      <span className="flex-1 truncate font-semibold">{sabor.nombre}</span>
      <Button
        type="button"
        variant="outline"
        className="size-11"
        disabled={cantidad === 0}
        onClick={() => onChange(-1)}
        aria-label={translate("amai.orders.remove_one", { name: sabor.nombre })}
      >
        <Minus className="size-5" />
      </Button>
      <output
        className="w-8 text-center text-lg font-bold tabular-nums"
        aria-label={translate("amai.orders.pieces_of", { name: sabor.nombre })}
      >
        {cantidad}
      </output>
      <Button
        type="button"
        className="h-11 px-3 gap-1"
        onClick={() => onChange(PASO_PIEZAS)}
        aria-label={translate("amai.orders.add_five", { name: sabor.nombre })}
      >
        <Plus className="size-4" />5
      </Button>
    </li>
  );
};

// Warns below the 40-piece minimum without blocking the save.
const MinimoAviso = ({ total }: { total: number }) => {
  const translate = useTranslate();
  const cumple = total >= MINIMO_PIEZAS;
  const avance = Math.min(100, Math.round((total / MINIMO_PIEZAS) * 100));
  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            cumple ? "bg-meta-ok" : "bg-meta-pendiente",
          )}
          style={{ width: `${avance}%` }}
        />
      </div>
      <p
        className={cn(
          "text-sm font-semibold",
          cumple ? "text-meta-ok-text" : "text-meta-pendiente-text",
        )}
        aria-live="polite"
      >
        {cumple
          ? translate("amai.orders.minimum_ok", { minimum: MINIMO_PIEZAS })
          : translate("amai.orders.minimum_missing", {
              missing: MINIMO_PIEZAS - total,
              minimum: MINIMO_PIEZAS,
            })}
      </p>
    </div>
  );
};

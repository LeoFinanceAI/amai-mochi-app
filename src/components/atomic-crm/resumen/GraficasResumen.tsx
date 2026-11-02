import { useLocaleState, useTranslate } from "ra-core";
import { cn } from "@/lib/utils";

import { fromIsoDate } from "../pedidos/fechaEntrega";
import type { ResumenSemana } from "../types";

const BAR_MAX_PX = 96;

// "Piezas por día": one bar per day, Monday to Sunday. One series, so one hue
// (brand pink); the best day in full color, the rest lighter, as in the mockup.
// Values sit above the bars in text ink, so no tooltip is needed.
export const PiezasPorDia = ({ dias }: { dias: ResumenSemana["por_dia"] }) => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const maximo = Math.max(...dias.map((d) => d.piezas));
  const diaCorto = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    weekday: "short",
  });
  return (
    <section aria-labelledby="piezas-dia" className="flex flex-col gap-3">
      <h2 id="piezas-dia" className="text-2xl">
        {translate("amai.summary.pieces_per_day")}
      </h2>
      <ul className="flex h-36 items-end justify-between gap-2">
        {dias.map((dia) => {
          const nombre = diaCorto.format(fromIsoDate(dia.fecha));
          const alto =
            maximo > 0
              ? Math.max(4, Math.round((dia.piezas / maximo) * BAR_MAX_PX))
              : 4;
          return (
            <li
              key={dia.fecha}
              aria-label={translate("amai.summary.day_pieces", {
                day: nombre,
                smart_count: dia.piezas,
              })}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span aria-hidden className="text-xs font-semibold tabular-nums">
                {dia.piezas}
              </span>
              <span
                aria-hidden
                className={cn(
                  "w-full max-w-10 rounded-t-[4px]",
                  dia.piezas === maximo && maximo > 0
                    ? "bg-primary"
                    : "bg-primary/30",
                )}
                style={{ height: alto }}
              />
              <span
                aria-hidden
                className="text-xs text-muted-foreground first-letter:uppercase"
              >
                {nombre.replace(".", "")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// "Sabores más vendidos": a horizontal bar per flavor in the flavor's own color
// (identity follows the flavor, never its rank); names and counts in text ink.
export const SaboresMasVendidos = ({
  sabores,
}: {
  sabores: ResumenSemana["por_sabor"];
}) => {
  const translate = useTranslate();
  const maximo = Math.max(1, ...sabores.map((s) => s.piezas));
  return (
    <section aria-labelledby="sabores-top" className="flex flex-col gap-3">
      <h2 id="sabores-top" className="text-2xl">
        {translate("amai.summary.top_flavors")}
      </h2>
      <ul className="flex flex-col gap-2">
        {sabores.map((sabor) => (
          <li
            key={sabor.sabor}
            aria-label={translate("amai.summary.flavor_pieces", {
              name: sabor.sabor,
              smart_count: sabor.piezas,
            })}
            className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2"
          >
            <span aria-hidden className="truncate text-sm font-semibold">
              {sabor.sabor}
            </span>
            <span aria-hidden className="h-3.5 rounded-full bg-muted">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.round((sabor.piezas / maximo) * 100)}%`,
                  background: sabor.color,
                }}
              />
            </span>
            <span aria-hidden className="text-right text-sm tabular-nums">
              {sabor.piezas}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

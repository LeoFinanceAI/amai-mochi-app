import { useQuery } from "@tanstack/react-query";
import { useDataProvider, useLocaleState, useTranslate } from "ra-core";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import { AMAI_PATHS } from "../amai/paths";
import { mesActual } from "../exportar/csv";
import { lunesDeLaSemana } from "../gastos/gastoForm";
import { fromIsoDate } from "../pedidos/fechaEntrega";
import type { CrmDataProvider } from "../providers/types";
import { CuerpoResumen } from "./CuerpoResumen";
import { mesElegido, moverMeses } from "./mes";
import { lunesElegido, moverSemanas } from "./semana";

const VISTAS = ["semana", "mes"] as const;
type Vista = (typeof VISTAS)[number];

// "Tu semana" from the approved mockup, plus the same figures for a month:
// sales, orders, collected vs. to collect, expenses and profit, top flavors
// and sales per client (and pieces per day for the week). All numbers come
// from resumen_semana() / resumen_mes() in SQL. What is shown lives in the
// address (?vista=mes&mes=YYYY-MM or ?semana=YYYY-MM-DD), so last week or
// last month is a tap away.
export const ResumenPage = () => {
  const translate = useTranslate();
  const [searchParams, setSearchParams] = useSearchParams();
  const vista: Vista = searchParams.get("vista") === "mes" ? "mes" : "semana";

  return (
    <AmaiPage
      title={translate(
        vista === "mes" ? "amai.summary.month_title" : "amai.summary.title",
      )}
    >
      <ChipRadioGroup
        legend={translate("amai.summary.period")}
        name="vista"
        options={VISTAS.map((value) => ({
          value,
          label: translate(`amai.summary.views.${value}`),
        }))}
        value={vista}
        onChange={(nueva) =>
          setSearchParams(nueva === "mes" ? { vista: "mes" } : {}, {
            replace: true,
          })
        }
      />
      {vista === "mes" ? <ResumenDelMes /> : <ResumenDeLaSemana />}
      <Link
        to={AMAI_PATHS.customers}
        className="inline-flex min-h-11 items-center self-start font-semibold text-primary"
      >
        {translate("amai.customers.link")} ›
      </Link>
    </AmaiPage>
  );
};

const ResumenDeLaSemana = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lunes = lunesElegido(searchParams.get("semana"));
  const consulta = useQuery({
    queryKey: ["resumen_semana", lunes],
    queryFn: () => dataProvider.resumenSemana(lunes),
  });
  return (
    <>
      <Navegacion
        anterior="amai.summary.previous_week"
        siguiente="amai.summary.next_week"
        esActual={lunes === lunesDeLaSemana()}
        onMover={(n) =>
          setSearchParams({ semana: moverSemanas(lunes, n) }, { replace: true })
        }
      >
        <RangoSemana lunes={lunes} />
      </Navegacion>
      <Estado consulta={consulta} />
      {consulta.data ? (
        <CuerpoResumen
          resumen={consulta.data}
          anterior={consulta.data.vendido_semana_anterior}
          comparacion="amai.summary.vs_last_week"
          sinVentas="amai.summary.no_sales"
          porDia={consulta.data.por_dia}
        />
      ) : null}
    </>
  );
};

const ResumenDelMes = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [locale] = useLocaleState();
  const [searchParams, setSearchParams] = useSearchParams();
  const mes = mesElegido(searchParams.get("mes"));
  const consulta = useQuery({
    queryKey: ["resumen_mes", mes],
    queryFn: () => dataProvider.resumenMes(`${mes}-01`),
  });
  const nombre = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    month: "long",
    year: "numeric",
  }).format(fromIsoDate(`${mes}-01`));
  return (
    <>
      <Navegacion
        anterior="amai.summary.previous_month"
        siguiente="amai.summary.next_month"
        esActual={mes === mesActual()}
        onMover={(n) =>
          setSearchParams(
            { vista: "mes", mes: moverMeses(mes, n) },
            { replace: true },
          )
        }
      >
        <p className="flex-1 text-center text-sm font-semibold first-letter:uppercase">
          {nombre}
        </p>
      </Navegacion>
      <Estado consulta={consulta} />
      {consulta.data ? (
        <CuerpoResumen
          resumen={consulta.data}
          anterior={consulta.data.vendido_mes_anterior}
          comparacion="amai.summary.vs_last_month"
          sinVentas="amai.summary.no_sales_month"
        />
      ) : null}
    </>
  );
};

interface NavegacionProps {
  anterior: string;
  siguiente: string;
  esActual: boolean;
  onMover: (n: number) => void;
  children: React.ReactNode;
}

// Previous / next period around its name; no going past the current one.
const Navegacion = ({
  anterior,
  siguiente,
  esActual,
  onMover,
  children,
}: NavegacionProps) => {
  const translate = useTranslate();
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="size-11"
        onClick={() => onMover(-1)}
        aria-label={translate(anterior)}
      >
        <ChevronLeft className="size-5" />
      </Button>
      {children}
      <Button
        variant="outline"
        className="size-11"
        disabled={esActual}
        onClick={() => onMover(1)}
        aria-label={translate(siguiente)}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
};

const Estado = ({
  consulta,
}: {
  consulta: { isPending: boolean; error: unknown };
}) => {
  const translate = useTranslate();
  if (consulta.isPending) return <Skeleton className="h-80 w-full" />;
  if (consulta.error) {
    return (
      <p className="text-destructive" role="alert">
        {translate("ra.notification.http_error")}
      </p>
    );
  }
  return null;
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

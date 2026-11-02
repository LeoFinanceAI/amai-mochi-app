import {
  useCreate,
  useDelete,
  useGetList,
  useLocaleState,
  useNotify,
  useTranslate,
} from "ra-core";
import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import { fromIsoDate } from "../pedidos/fechaEntrega";
import { formatoDinero, formatoFecha } from "../pedidos/formatoPedido";
import type { Gasto } from "../types";
import {
  CATEGORIAS,
  DIAS_DE_HISTORIA,
  fechaDesde,
  formVacio,
  lunesDeLaSemana,
  toGasto,
  totalDesde,
  type GastoForm,
} from "./gastoForm";

const MAX_GASTOS = 500;
const MAX_TEXT = 200;

// "Gastos": write down what was spent (amount, category, day, a note) and see
// this week's total plus the last weeks' expenses. The weekly summary
// (stage 4) subtracts them from sales to get the profit.
export const GastosPage = () => {
  const translate = useTranslate();
  const { data, isPending, error } = useGetList<Gasto>("gasto", {
    filter: { "fecha@gte": fechaDesde(DIAS_DE_HISTORIA) },
    sort: { field: "fecha", order: "DESC" },
    pagination: { page: 1, perPage: MAX_GASTOS },
  });

  return (
    <AmaiPage title={translate("amai.expenses.title")}>
      <NuevoGasto />
      {isPending ? <Skeleton className="h-40 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {data ? <ListaGastos gastos={data} /> : null}
    </AmaiPage>
  );
};

const NuevoGasto = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [form, setForm] = useState<GastoForm>(() => formVacio());
  const [create, { isPending }] = useCreate<Gasto>();
  const update = (cambio: Partial<GastoForm>) =>
    setForm((actual) => ({ ...actual, ...cambio }));
  const gasto = toGasto(form);

  const guardar = (event: FormEvent) => {
    event.preventDefault();
    if (!gasto) return;
    create(
      "gasto",
      { data: gasto },
      {
        onSuccess: () => {
          notify("amai.expenses.saved", { type: "success" });
          setForm(formVacio());
        },
        onError: () => notify("amai.expenses.save_error", { type: "error" }),
      },
    );
  };

  return (
    <form
      noValidate
      onSubmit={guardar}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {translate("amai.expenses.amount")}
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            $
          </span>
          <Input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="min-h-11 pl-7 tabular-nums"
            value={form.monto}
            onChange={(event) =>
              update({ monto: event.target.value.replace(",", ".") })
            }
          />
        </div>
      </label>
      <ChipRadioGroup
        legend={translate("amai.expenses.category")}
        name="categoria"
        options={CATEGORIAS.map((value) => ({
          value,
          label: translate(`amai.expenses.categories.${value}`),
        }))}
        value={form.categoria}
        onChange={(categoria) => update({ categoria })}
      />
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {translate("amai.expenses.date")}
        <Input
          type="date"
          className="min-h-11"
          value={form.fecha}
          onChange={(event) => update({ fecha: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {translate("amai.expenses.description")}
        <Input
          className="min-h-11"
          maxLength={MAX_TEXT}
          placeholder={translate("amai.expenses.description_placeholder")}
          value={form.descripcion}
          onChange={(event) => update({ descripcion: event.target.value })}
        />
      </label>
      <Button
        type="submit"
        className="min-h-11 self-start px-6"
        disabled={!gasto || isPending}
      >
        {translate(isPending ? "amai.orders.saving" : "amai.expenses.save")}
      </Button>
    </form>
  );
};

const ListaGastos = ({ gastos }: { gastos: Gasto[] }) => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const semana = totalDesde(gastos, lunesDeLaSemana());

  return (
    <section
      aria-label={translate("amai.expenses.recent")}
      className="flex flex-col gap-3"
    >
      <p className="text-lg font-semibold">
        {translate("amai.expenses.this_week", {
          total: formatoDinero(semana),
        })}
      </p>
      {gastos.length === 0 ? (
        <p className="text-muted-foreground">
          {translate("amai.expenses.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gastos.map((gasto) => (
            <GastoFila key={gasto.id} gasto={gasto} locale={locale} />
          ))}
        </ul>
      )}
    </section>
  );
};

const GastoFila = ({ gasto, locale }: { gasto: Gasto; locale: string }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [borrar, { isPending }] = useDelete<Gasto>();
  const categoria = translate(`amai.expenses.categories.${gasto.categoria}`);

  const eliminar = () =>
    borrar(
      "gasto",
      { id: gasto.id, previousData: gasto },
      {
        mutationMode: "undoable",
        onSuccess: () =>
          notify("amai.expenses.deleted", { type: "info", undoable: true }),
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card pl-4 pr-1 min-h-14">
      <div className="flex min-w-0 flex-1 flex-col py-2">
        <span className="font-semibold">
          {formatoDinero(Number(gasto.monto))} · {categoria}
        </span>
        <span className="truncate text-sm text-muted-foreground first-letter:uppercase">
          {[formatoFecha(fromIsoDate(gasto.fecha), locale), gasto.descripcion]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <Button
        variant="ghost"
        className="size-11"
        disabled={isPending}
        onClick={eliminar}
        aria-label={translate("amai.expenses.delete", {
          name: `${formatoDinero(Number(gasto.monto))} ${categoria}`,
        })}
      >
        <Trash2 className="size-5" />
      </Button>
    </li>
  );
};

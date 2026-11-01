import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useGetList, useNotify, useTranslate } from "ra-core";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import type { Producto, Sabor } from "../types";
import { cambios, esPrecioValido, type Borradores } from "./preciosForm";

const ALL = { page: 1, perPage: 100 } as const;

// "Precios": the per-piece list price of each active flavor. fn_precio() uses
// it for new orders (and edits of pending ones); saved orders keep the price
// they were frozen with. Wholesale tiers and client prices come later.
export const PreciosPage = () => {
  const translate = useTranslate();
  const sabores = useGetList<Sabor>("sabor", {
    filter: { activo: true },
    sort: { field: "nombre", order: "ASC" },
    pagination: ALL,
  });
  const productos = useGetList<Producto>("producto", {
    filter: { presentacion: "pieza" },
    sort: { field: "id", order: "ASC" },
    pagination: ALL,
  });

  const isPending = sabores.isPending || productos.isPending;
  const error = sabores.error || productos.error;

  // Each active flavor with its per-piece product.
  const filas = (sabores.data ?? []).flatMap((sabor) => {
    const producto = productos.data?.find((p) => p.sabor_id === sabor.id);
    return producto ? [{ sabor, producto }] : [];
  });

  return (
    <AmaiPage title={translate("amai.prices.title")}>
      <p className="text-sm text-muted-foreground">
        {translate("amai.prices.intro")}
      </p>
      {isPending ? <Skeleton className="h-60 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {!isPending && !error && filas.length === 0 ? (
        <p className="text-muted-foreground">
          {translate("amai.orders.no_flavors")}
        </p>
      ) : null}
      {filas.length ? <PreciosForm filas={filas} /> : null}
    </AmaiPage>
  );
};

interface Fila {
  sabor: Sabor;
  producto: Producto;
}

const PreciosForm = ({ filas }: { filas: Fila[] }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const [borradores, setBorradores] = useState<Borradores>({});
  const [todos, setTodos] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const valor = (producto: Producto) =>
    borradores[producto.id] ?? String(Number(producto.precio_lista));
  const invalidos = filas.filter((f) => !esPrecioValido(valor(f.producto)));
  const productos = filas.map((f) => f.producto);
  const pendientes = invalidos.length ? [] : cambios(productos, borradores);

  const aplicarATodos = () =>
    setBorradores(
      Object.fromEntries(productos.map((p) => [p.id, todos.trim()])),
    );

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (invalidos.length || pendientes.length === 0) return;
    setIsSaving(true);
    try {
      await Promise.all(
        pendientes.map(({ id, precio_lista }) =>
          dataProvider.update("producto", {
            id,
            data: { precio_lista },
            previousData: productos.find((p) => p.id === id),
          }),
        ),
      );
      notify("amai.prices.saved", { type: "success" });
      setBorradores({});
    } catch {
      notify("amai.prices.save_error", { type: "error" });
    } finally {
      // Some prices may have saved even if another failed: show what is stored.
      await queryClient.invalidateQueries({ queryKey: ["producto"] });
      await queryClient.invalidateQueries({ queryKey: ["pedido"] });
      setIsSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={guardar} className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
          {translate("amai.prices.same_for_all")}
          <PrecioInput value={todos} onChange={setTodos} />
        </label>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={!esPrecioValido(todos)}
          onClick={aplicarATodos}
        >
          {translate("amai.prices.apply_to_all")}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {filas.map(({ sabor, producto }) => {
          const texto = valor(producto);
          const esValido = esPrecioValido(texto);
          return (
            <li
              key={producto.id}
              className="flex items-center gap-3 rounded-xl border bg-card pl-4 pr-2 min-h-14"
            >
              <span
                aria-hidden
                className="size-4 shrink-0 rounded-full"
                style={{ background: sabor.color }}
              />
              <label
                htmlFor={`precio-${producto.id}`}
                className="flex-1 truncate font-semibold"
              >
                {sabor.nombre}
              </label>
              <div className="flex w-32 flex-col">
                <PrecioInput
                  id={`precio-${producto.id}`}
                  value={texto}
                  invalid={!esValido}
                  onChange={(nuevo) =>
                    setBorradores((actual) => ({
                      ...actual,
                      [producto.id]: nuevo,
                    }))
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
      {invalidos.length ? (
        <p className="text-sm text-destructive" role="alert">
          {translate("amai.prices.invalid")}
        </p>
      ) : null}
      <Button
        type="submit"
        className="min-h-11 self-start px-6"
        disabled={isSaving || pendientes.length === 0}
      >
        {translate(isSaving ? "amai.orders.saving" : "amai.prices.save")}
      </Button>
    </form>
  );
};

interface PrecioInputProps {
  id?: string;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}

// A peso amount: numeric keypad on phones, "$" in front.
const PrecioInput = ({ id, value, invalid, onChange }: PrecioInputProps) => (
  <div className="relative">
    <span
      aria-hidden
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    >
      $
    </span>
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className="min-h-11 pl-7 text-right tabular-nums"
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(",", "."))}
    />
  </div>
);

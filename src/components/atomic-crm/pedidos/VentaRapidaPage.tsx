import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useGetList, useNotify, useTranslate } from "ra-core";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import type { CrmDataProvider } from "../providers/types";
import type { Cliente, VentaRapida } from "../types";
import {
  METODOS_PAGO,
  cambiarCantidad,
  totalPiezas,
  type MetodoPagoAlRecibir,
  type NuevoPedidoForm,
} from "./nuevoPedidoForm";
import { SaborCantidades } from "./SaborCantidades";

// The chip for "Público en general"; venta_rapida() picks that client in SQL.
const PUBLICO = "publico";
const MAX_TEXT = 500;
const ALL_CLIENTS = 200;

interface VentaForm {
  cliente: string;
  cantidades: NuevoPedidoForm["cantidades"];
  metodoPago: MetodoPagoAlRecibir;
  notas: string;
}

const VENTA_VACIA: VentaForm = {
  cliente: PUBLICO,
  cantidades: {},
  metodoPago: "efectivo",
  notas: "",
};

// The venta_rapida() input, or null while no piece is picked.
const toVentaRapida = (form: VentaForm): VentaRapida | null => {
  const lineas = Object.entries(form.cantidades)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([saborId, cantidad]) => ({ sabor_id: Number(saborId), cantidad }));
  if (!lineas.length) return null;
  return {
    cliente_id: form.cliente === PUBLICO ? null : Number(form.cliente),
    metodo_pago: form.metodoPago,
    notas: form.notas,
    lineas,
  };
};

// "Venta rápida": a sale to the public or at an event, delivered and paid on
// the spot. No minimum, one piece at a time; saved by venta_rapida() in SQL.
export const VentaRapidaPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VentaForm>(VENTA_VACIA);
  const update = (cambio: Partial<VentaForm>) =>
    setForm((actual) => ({ ...actual, ...cambio }));
  const venta = toVentaRapida(form);
  const piezas = totalPiezas(form.cantidades);

  const { mutate, isPending } = useMutation({
    mutationFn: (nueva: VentaRapida) => dataProvider.ventaRapida(nueva),
    onSuccess: () => {
      notify("amai.quick_sale.saved", {
        type: "success",
        messageArgs: { smart_count: piezas },
      });
      setForm(VENTA_VACIA);
      window.scrollTo({ top: 0 });
      for (const key of ["pedido", "pago", "cliente", "v_cliente_actividad"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: () => notify("amai.quick_sale.save_error", { type: "error" }),
  });

  const guardar = (event: FormEvent) => {
    event.preventDefault();
    if (venta) mutate(venta);
  };

  return (
    <AmaiPage title={translate("amai.quick_sale.title")}>
      <p className="text-muted-foreground">
        {translate("amai.quick_sale.intro")}
      </p>
      <form
        noValidate
        onSubmit={guardar}
        className="flex flex-col gap-6 pb-24 md:pb-0"
      >
        <ClienteVenta
          value={form.cliente}
          onChange={(cliente) => update({ cliente })}
        />
        <SaborCantidades
          cantidades={form.cantidades}
          paso={1}
          conMinimo={false}
          onChange={(saborId, delta) =>
            update({
              cantidades: cambiarCantidad(form.cantidades, saborId, delta),
            })
          }
        />
        <ChipRadioGroup
          legend={translate("amai.quick_sale.payment")}
          name="metodo_pago"
          options={METODOS_PAGO.map((value) => ({
            value,
            label: translate(`amai.orders.payment_methods.${value}`),
          }))}
          value={form.metodoPago}
          onChange={(metodoPago) => update({ metodoPago })}
        />
        <label className="flex flex-col gap-1 text-sm">
          {translate("amai.orders.notes")}
          <Input
            className="min-h-11"
            value={form.notas}
            maxLength={MAX_TEXT}
            placeholder={translate("amai.quick_sale.notes_placeholder")}
            onChange={(event) => update({ notas: event.target.value })}
          />
        </label>
        <div className="fixed inset-x-0 bottom-14 z-40 flex items-center gap-3 border-t bg-background px-4 py-3 md:static md:border-0 md:p-0">
          <div className="flex flex-1 flex-col">
            <span className="font-bold">
              {translate("amai.orders.pieces", { smart_count: piezas })}
            </span>
            {venta ? null : (
              <span className="text-xs text-muted-foreground">
                {translate("amai.orders.missing_pieces")}
              </span>
            )}
          </div>
          <Button
            type="submit"
            className="min-h-11 px-6"
            disabled={!venta || isPending}
          >
            {translate(
              isPending ? "amai.orders.saving" : "amai.quick_sale.save",
            )}
          </Button>
        </div>
      </form>
    </AmaiPage>
  );
};

// "Público en general" or one of the event or public clients.
const ClienteVenta = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (cliente: string) => void;
}) => {
  const translate = useTranslate();
  const { data } = useGetList<Cliente>("cliente", {
    filter: { activo: true },
    sort: { field: "nombre", order: "ASC" },
    pagination: { page: 1, perPage: ALL_CLIENTS },
  });
  const otros = (data ?? []).filter(
    (c) =>
      c.tipo !== "distribuidor" &&
      !(c.tipo === "publico" && c.nombre === "Público en general"),
  );
  return (
    <ChipRadioGroup
      legend={translate("amai.quick_sale.client")}
      name="cliente"
      options={[
        { value: PUBLICO, label: translate("amai.quick_sale.public") },
        ...otros.map((c) => ({ value: String(c.id), label: c.nombre })),
      ]}
      value={value}
      onChange={onChange}
    />
  );
};

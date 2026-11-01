import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { AmaiPage } from "../amai/AmaiPage";
import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import type { CrmDataProvider } from "../providers/types";
import type { NuevoPedido } from "../types";
import { ClienteSelector } from "./ClienteSelector";
import { EntregaSelector } from "./EntregaSelector";
import { fechaEntrega } from "./fechaEntrega";
import {
  FORM_VACIO,
  METODOS_PAGO,
  cambiarCantidad,
  toNuevoPedido,
  totalPiezas,
  type NuevoPedidoForm,
} from "./nuevoPedidoForm";
import { SaborCantidades } from "./SaborCantidades";

const MAX_TEXT = 500;

// "Nuevo pedido" from the approved mockup: client, delivery day, pieces per
// flavor, payment on delivery, location and notes. Saved in one transaction by
// crear_pedido() in SQL, which also prices each line.
export const NuevoPedidoPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NuevoPedidoForm>(FORM_VACIO);
  const update = (cambio: Partial<NuevoPedidoForm>) =>
    setForm((actual) => ({ ...actual, ...cambio }));

  const { mutate, isPending } = useMutation({
    mutationFn: (pedido: NuevoPedido) => dataProvider.crearPedido(pedido),
    onSuccess: () => {
      notify("amai.orders.saved", { type: "success" });
      setForm(FORM_VACIO);
      // Back to the top, ready for the next WhatsApp order.
      window.scrollTo({ top: 0 });
      queryClient.invalidateQueries({ queryKey: ["pedido"] });
    },
    onError: () => notify("amai.orders.save_error", { type: "error" }),
  });

  const pedido = toNuevoPedido(form);
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pedido) {
      mutate(pedido);
    }
  };

  return (
    <AmaiPage title={translate("amai.navigation.new_order")}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 pb-24 md:pb-0"
      >
        <ClienteSelector
          value={form.clienteId}
          onChange={(clienteId) => update({ clienteId })}
        />
        <EntregaSelector
          opcion={form.entrega}
          otraFecha={form.otraFecha}
          onChange={update}
        />
        <SaborCantidades
          cantidades={form.cantidades}
          onChange={(saborId, delta) =>
            update({
              cantidades: cambiarCantidad(form.cantidades, saborId, delta),
            })
          }
        />
        <ChipRadioGroup
          legend={translate("amai.orders.payment")}
          name="metodo_pago"
          options={METODOS_PAGO.map((value) => ({
            value,
            label: translate(`amai.orders.payment_methods.${value}`),
          }))}
          value={form.metodoPago}
          onChange={(metodoPago) => update({ metodoPago })}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold mb-2">
            {translate("amai.orders.location_and_notes")}
          </legend>
          <label className="flex flex-col gap-1 text-sm">
            {translate("amai.orders.location")}
            <Input
              className="min-h-11"
              value={form.direccion}
              maxLength={MAX_TEXT}
              placeholder={translate("amai.orders.location_placeholder")}
              onChange={(event) => update({ direccion: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {translate("amai.orders.notes")}
            <Textarea
              rows={3}
              value={form.notas}
              maxLength={MAX_TEXT}
              onChange={(event) => update({ notas: event.target.value })}
            />
          </label>
        </fieldset>
        <BarraGuardar
          form={form}
          canSave={pedido != null}
          isSaving={isPending}
        />
      </form>
    </AmaiPage>
  );
};

interface BarraGuardarProps {
  form: NuevoPedidoForm;
  canSave: boolean;
  isSaving: boolean;
}

// Pinned above the bottom bar on phones, so saving never needs a scroll.
const BarraGuardar = ({ form, canSave, isSaving }: BarraGuardarProps) => {
  const translate = useTranslate();
  const total = totalPiezas(form.cantidades);
  const falta = queFalta(form);
  return (
    <div className="fixed inset-x-0 bottom-14 z-40 flex items-center gap-3 border-t bg-background px-4 py-3 md:static md:border-0 md:p-0">
      <div className="flex flex-1 flex-col">
        <span className="font-bold">
          {translate("amai.orders.pieces", { smart_count: total })}
        </span>
        {falta ? (
          <span className="text-xs text-muted-foreground">
            {translate(falta)}
          </span>
        ) : null}
      </div>
      <Button
        type="submit"
        className="min-h-11 px-6"
        disabled={!canSave || isSaving}
      >
        {translate(isSaving ? "amai.orders.saving" : "amai.orders.save")}
      </Button>
    </div>
  );
};

// The first thing still missing before the order can be saved, if any.
const queFalta = (form: NuevoPedidoForm): string | null => {
  if (form.clienteId == null) return "amai.orders.missing_client";
  if (totalPiezas(form.cantidades) === 0) return "amai.orders.missing_pieces";
  if (!fechaEntrega(form.entrega, form.otraFecha)) {
    return "amai.orders.missing_date";
  }
  return null;
};

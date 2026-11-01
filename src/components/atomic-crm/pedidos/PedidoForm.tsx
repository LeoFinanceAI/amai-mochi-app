import { useTranslate } from "ra-core";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import type { NuevoPedido } from "../types";
import { ClienteSelector } from "./ClienteSelector";
import { EntregaSelector } from "./EntregaSelector";
import { fechaEntrega } from "./fechaEntrega";
import {
  METODOS_PAGO,
  cambiarCantidad,
  toNuevoPedido,
  totalPiezas,
  type NuevoPedidoForm,
} from "./nuevoPedidoForm";
import { SaborCantidades } from "./SaborCantidades";

const MAX_TEXT = 500;

interface PedidoFormProps {
  initial: NuevoPedidoForm;
  onSave: (pedido: NuevoPedido) => void;
  isSaving: boolean;
  // Translation key of the save button.
  submitLabel: string;
}

// The order form from the approved mockup, shared by "Nuevo pedido" and
// "Editar pedido": client, delivery day, pieces per flavor, payment on
// delivery, location and notes. Remount it (key) to start over.
export const PedidoForm = ({
  initial,
  onSave,
  isSaving,
  submitLabel,
}: PedidoFormProps) => {
  const translate = useTranslate();
  const [form, setForm] = useState<NuevoPedidoForm>(initial);
  const update = (cambio: Partial<NuevoPedidoForm>) =>
    setForm((actual) => ({ ...actual, ...cambio }));

  const pedido = toNuevoPedido(form);
  // noValidate: the form checks itself, and an overdue order being edited
  // must not be blocked by the date picker's min.
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pedido) {
      onSave(pedido);
    }
  };

  return (
    <form
      noValidate
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
        isSaving={isSaving}
        submitLabel={submitLabel}
      />
    </form>
  );
};

interface BarraGuardarProps {
  form: NuevoPedidoForm;
  canSave: boolean;
  isSaving: boolean;
  submitLabel: string;
}

// Pinned above the bottom bar on phones, so saving never needs a scroll.
const BarraGuardar = ({
  form,
  canSave,
  isSaving,
  submitLabel,
}: BarraGuardarProps) => {
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
        {translate(isSaving ? "amai.orders.saving" : submitLabel)}
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

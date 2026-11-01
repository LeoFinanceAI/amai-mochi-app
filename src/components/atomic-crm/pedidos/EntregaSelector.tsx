import { useTranslate } from "ra-core";
import { Input } from "@/components/ui/input";

import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import {
  OPCIONES_ENTREGA,
  toIsoDate,
  type OpcionEntrega,
} from "./fechaEntrega";

interface EntregaSelectorProps {
  opcion: OpcionEntrega;
  otraFecha: string;
  onChange: (cambio: { entrega?: OpcionEntrega; otraFecha?: string }) => void;
}

// Delivery day: tomorrow, the day after, or a date picked by hand.
export const EntregaSelector = ({
  opcion,
  otraFecha,
  onChange,
}: EntregaSelectorProps) => {
  const translate = useTranslate();
  const options = OPCIONES_ENTREGA.map((value) => ({
    value,
    label: translate(`amai.orders.delivery_options.${value}`),
  }));
  return (
    <div className="flex flex-col gap-2">
      <ChipRadioGroup
        legend={translate("amai.orders.delivery")}
        name="entrega"
        options={options}
        value={opcion}
        onChange={(entrega) => onChange({ entrega })}
      />
      {opcion === "otra" ? (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {translate("amai.orders.delivery_date")}
          <Input
            type="date"
            className="min-h-11"
            min={toIsoDate(new Date())}
            value={otraFecha}
            onChange={(event) => onChange({ otraFecha: event.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
};

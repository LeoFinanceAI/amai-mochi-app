import { useTranslate } from "ra-core";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ESPERA_MS = 300;
const MAX_TEXT = 100;

interface BuscarPedidosProps {
  texto: string;
  fecha: string;
  onChange: (cambio: { texto?: string; fecha?: string }) => void;
}

// Search orders by client name and/or delivery day. The name is sent after a
// short pause in typing, so each keystroke does not start a new search.
export const BuscarPedidos = ({
  texto,
  fecha,
  onChange,
}: BuscarPedidosProps) => {
  const translate = useTranslate();
  const [escrito, setEscrito] = useState(texto);

  useEffect(() => {
    if (escrito === texto) return;
    const timer = setTimeout(() => onChange({ texto: escrito }), ESPERA_MS);
    return () => clearTimeout(timer);
  }, [escrito, texto, onChange]);

  return (
    <div role="search" className="flex flex-col gap-2 sm:flex-row">
      <label className="relative flex grow items-center">
        <span className="sr-only">
          {translate("amai.orders.search.client")}
        </span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        />
        <Input
          type="search"
          className="min-h-11 pl-9"
          value={escrito}
          maxLength={MAX_TEXT}
          placeholder={translate("amai.orders.search.client")}
          onChange={(event) => setEscrito(event.target.value)}
        />
      </label>
      <div className="flex items-center gap-2">
        <label className="flex grow items-center gap-2 text-sm">
          <span className="shrink-0">
            {translate("amai.orders.search.day")}
          </span>
          <Input
            type="date"
            className="min-h-11"
            value={fecha}
            onChange={(event) => onChange({ fecha: event.target.value })}
          />
        </label>
        {texto || fecha ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 gap-1"
            onClick={() => {
              setEscrito("");
              onChange({ texto: "", fecha: "" });
            }}
          >
            <X className="size-4" />
            {translate("amai.orders.search.clear")}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

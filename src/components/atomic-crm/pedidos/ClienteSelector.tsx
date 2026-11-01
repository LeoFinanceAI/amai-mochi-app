import { useGetList, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { ChipRadioGroup } from "../amai/ChipRadioGroup";
import type { Cliente } from "../types";

// ~5 distributors plus public and event buyers: all fit as chips.
const ALL_CLIENTS = 200;

interface ClienteSelectorProps {
  value: string | null;
  onChange: (clienteId: string) => void;
}

export const ClienteSelector = ({ value, onChange }: ClienteSelectorProps) => {
  const translate = useTranslate();
  const { data, isPending, error } = useGetList<Cliente>("cliente", {
    filter: { activo: true },
    sort: { field: "nombre", order: "ASC" },
    pagination: { page: 1, perPage: ALL_CLIENTS },
  });

  if (isPending) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (error) {
    return (
      <p className="text-destructive" role="alert">
        {translate("ra.notification.http_error")}
      </p>
    );
  }
  const options = data.map((cliente) => ({
    value: String(cliente.id),
    label: [cliente.nombre, cliente.zona].filter(Boolean).join(" · "),
  }));
  return (
    <ChipRadioGroup
      legend={translate("resources.cliente.name", { smart_count: 1 })}
      name="cliente"
      options={options}
      value={value}
      onChange={onChange}
    >
      <Link
        to="/cliente/create"
        className="inline-flex min-h-11 grow items-center justify-center gap-1 rounded-xl border border-dashed px-4 text-sm font-semibold text-primary"
      >
        <Plus className="size-4" />
        {translate("amai.clients.add")}
      </Link>
    </ChipRadioGroup>
  );
};

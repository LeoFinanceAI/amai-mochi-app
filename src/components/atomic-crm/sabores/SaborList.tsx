import {
  ListBase,
  useListContext,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { Sabor } from "../types";
import { AmaiPage } from "../amai/AmaiPage";

// The whole catalog fits on one screen; no pagination.
const ALL_FLAVORS = 100;

export const SaborList = () => {
  const translate = useTranslate();
  return (
    <ListBase<Sabor>
      resource="sabor"
      sort={{ field: "nombre", order: "ASC" }}
      perPage={ALL_FLAVORS}
    >
      <AmaiPage title={translate("resources.sabor.name", { smart_count: 2 })}>
        <Link
          to="/sabor/create"
          className={cn(buttonVariants(), "min-h-11 self-start gap-2")}
        >
          <Plus className="size-5" />
          {translate("amai.flavors.add")}
        </Link>
        <SaborRows />
      </AmaiPage>
    </ListBase>
  );
};

// Active flavors first, then retired ones, each alphabetically.
const byActiveThenName = (a: Sabor, b: Sabor) =>
  Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, "es");

const SaborRows = () => {
  const translate = useTranslate();
  const { data, isPending, error } = useListContext<Sabor>();

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="mt-4 text-destructive" role="alert">
        {translate("ra.notification.http_error")}
      </p>
    );
  }
  if (!data?.length) {
    return (
      <p className="mt-4 text-muted-foreground">
        {translate("amai.flavors.empty")}
      </p>
    );
  }
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {[...data].sort(byActiveThenName).map((sabor) => (
        <SaborRow key={sabor.id} sabor={sabor} />
      ))}
    </ul>
  );
};

const SaborRow = ({ sabor }: { sabor: Sabor }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [update, { isPending }] = useUpdate<Sabor>();

  const toggleActivo = (activo: boolean) =>
    update(
      "sabor",
      { id: sabor.id, data: { activo }, previousData: sabor },
      {
        mutationMode: "pessimistic",
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-4 min-h-14",
        !sabor.activo && "opacity-60",
      )}
    >
      <Link
        to={`/sabor/${sabor.id}`}
        className="flex flex-1 min-w-0 items-center gap-3 py-3"
      >
        <span
          aria-hidden
          className="size-6 shrink-0 rounded-full border"
          style={{ background: sabor.color }}
        />
        <span className="truncate font-semibold">{sabor.nombre}</span>
        {sabor.activo ? null : (
          <span className="text-xs text-muted-foreground">
            {translate("amai.flavors.inactive")}
          </span>
        )}
      </Link>
      <Switch
        checked={sabor.activo}
        disabled={isPending}
        onCheckedChange={toggleActivo}
        aria-label={translate("amai.flavors.active_toggle", {
          name: sabor.nombre,
        })}
      />
    </li>
  );
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useGetOne, useNotify, useTranslate } from "ra-core";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

import { AmaiPage } from "../amai/AmaiPage";
import { AMAI_PATHS } from "../amai/paths";
import type { CrmDataProvider } from "../providers/types";
import type { NuevoPedido, PedidoLista } from "../types";
import { formDesdePedido } from "./nuevoPedidoForm";
import { PedidoForm } from "./PedidoForm";

// "Editar pedido": the same form, filled with a pending order. Saved by
// actualizar_pedido() in SQL, which re-prices the lines at today's prices.
export const EditarPedidoPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const navigate = useNavigate();
  const id = Number(useParams().id);
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  // Opened from a scrolled list: start at the top, where the client is.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const {
    data: pedido,
    isPending,
    error,
  } = useGetOne<PedidoLista>(
    "pedido",
    { id },
    { enabled: Number.isInteger(id) },
  );

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: (cambios: NuevoPedido) =>
      dataProvider.actualizarPedido(id, cambios),
    onSuccess: () => {
      notify("amai.orders.updated", { type: "success" });
      queryClient.invalidateQueries({ queryKey: ["pedido"] });
      navigate(AMAI_PATHS.orders);
    },
    onError: () => notify("amai.orders.save_error", { type: "error" }),
  });

  return (
    <AmaiPage title={translate("amai.orders.edit_title")}>
      {isPending ? <Skeleton className="h-60 w-full" /> : null}
      {error ? (
        <p className="text-destructive" role="alert">
          {translate("ra.notification.http_error")}
        </p>
      ) : null}
      {pedido && pedido.estado !== "pendiente" ? (
        <p className="text-muted-foreground">
          {translate("amai.orders.only_pending")}
        </p>
      ) : null}
      {pedido?.estado === "pendiente" ? (
        <PedidoForm
          initial={formDesdePedido(pedido)}
          onSave={(cambios) => mutate(cambios)}
          isSaving={isSaving}
          submitLabel="amai.orders.save_changes"
        />
      ) : null}
    </AmaiPage>
  );
};

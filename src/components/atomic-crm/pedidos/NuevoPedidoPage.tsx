import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";
import { List } from "lucide-react";

import { AmaiPage } from "../amai/AmaiPage";
import { AMAI_PATHS } from "../amai/paths";
import type { CrmDataProvider } from "../providers/types";
import type { NuevoPedido } from "../types";
import { FORM_VACIO } from "./nuevoPedidoForm";
import { PedidoForm } from "./PedidoForm";

// "Nuevo pedido": saved in one transaction by crear_pedido() in SQL, which
// also prices each line. After saving, the form starts over for the next one.
export const NuevoPedidoPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();
  const [formKey, setFormKey] = useState(0);

  const { mutate, isPending } = useMutation({
    mutationFn: (pedido: NuevoPedido) => dataProvider.crearPedido(pedido),
    onSuccess: () => {
      notify("amai.orders.saved", { type: "success" });
      setFormKey((key) => key + 1);
      // Back to the top, ready for the next WhatsApp order.
      window.scrollTo({ top: 0 });
      queryClient.invalidateQueries({ queryKey: ["pedido"] });
    },
    onError: () => notify("amai.orders.save_error", { type: "error" }),
  });

  return (
    <AmaiPage title={translate("amai.navigation.new_order")}>
      <Link
        to={AMAI_PATHS.orders}
        className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-primary"
      >
        <List className="size-5" />
        {translate("amai.orders.view_orders")}
      </Link>
      <PedidoForm
        key={formKey}
        initial={FORM_VACIO}
        onSave={(pedido) => mutate(pedido)}
        isSaving={isPending}
        submitLabel="amai.orders.save"
      />
    </AmaiPage>
  );
};

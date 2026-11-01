import { Route } from "react-router";

import { EditarPedidoPage } from "../pedidos/EditarPedidoPage";
import { EntregasHoyPage } from "../pedidos/EntregasHoyPage";
import { NuevoPedidoPage } from "../pedidos/NuevoPedidoPage";
import { PedidoListPage } from "../pedidos/PedidoListPage";
import { ComingSoonPage } from "./ComingSoonPage";
import { AMAI_PATHS } from "./paths";

// Shared by the desktop and mobile route trees (an array, because CustomRoutes
// reads its children as <Route> elements).
export const amaiRoutes = [
  <Route key="orders" path={AMAI_PATHS.orders} element={<PedidoListPage />} />,
  <Route
    key="deliveries-today"
    path={AMAI_PATHS.deliveriesToday}
    element={<EntregasHoyPage />}
  />,
  <Route
    key="edit-order"
    path={`${AMAI_PATHS.orders}/:id/edit`}
    element={<EditarPedidoPage />}
  />,
  <Route
    key="new-order"
    path={AMAI_PATHS.newOrder}
    element={<NuevoPedidoPage />}
  />,
  <Route
    key="receivables"
    path={AMAI_PATHS.receivables}
    element={
      <ComingSoonPage titleKey="amai.navigation.receivables" stage={3} />
    }
  />,
  <Route
    key="summary"
    path={AMAI_PATHS.summary}
    element={<ComingSoonPage titleKey="amai.navigation.summary" stage={4} />}
  />,
];

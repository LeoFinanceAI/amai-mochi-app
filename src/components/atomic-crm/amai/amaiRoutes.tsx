import { Route } from "react-router";

import { EditarPedidoPage } from "../pedidos/EditarPedidoPage";
import { EntregasHoyPage } from "../pedidos/EntregasHoyPage";
import { NuevoPedidoPage } from "../pedidos/NuevoPedidoPage";
import { PedidoListPage } from "../pedidos/PedidoListPage";
import { PreciosPage } from "../precios/PreciosPage";
import { GastosPage } from "../gastos/GastosPage";
import { PorCobrarPage } from "../cobranza/PorCobrarPage";
import { ResumenPage } from "../resumen/ResumenPage";
import { AMAI_PATHS } from "./paths";

// Shared by the desktop and mobile route trees (an array, because CustomRoutes
// reads its children as <Route> elements).
export const amaiRoutes = [
  <Route key="prices" path={AMAI_PATHS.prices} element={<PreciosPage />} />,
  <Route key="expenses" path={AMAI_PATHS.expenses} element={<GastosPage />} />,
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
    element={<PorCobrarPage />}
  />,
  <Route key="summary" path={AMAI_PATHS.summary} element={<ResumenPage />} />,
];

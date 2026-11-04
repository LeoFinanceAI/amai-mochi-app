import { Route } from "react-router";

import { EditarPedidoPage } from "../pedidos/EditarPedidoPage";
import { EntregasHoyPage } from "../pedidos/EntregasHoyPage";
import { NuevoPedidoPage } from "../pedidos/NuevoPedidoPage";
import { PedidoListPage } from "../pedidos/PedidoListPage";
import { ProduccionPage } from "../pedidos/ProduccionPage";
import { VentaRapidaPage } from "../pedidos/VentaRapidaPage";
import { TusClientesPage } from "../clientes/TusClientesPage";
import { PreciosPage } from "../precios/PreciosPage";
import { GastosPage } from "../gastos/GastosPage";
import { ExportarPage } from "../exportar/ExportarPage";
import { PorCobrarPage } from "../cobranza/PorCobrarPage";
import { ResumenPage } from "../resumen/ResumenPage";
import { AMAI_PATHS } from "./paths";

// Shared by the desktop and mobile route trees (an array, because CustomRoutes
// reads its children as <Route> elements).
export const amaiRoutes = [
  <Route key="prices" path={AMAI_PATHS.prices} element={<PreciosPage />} />,
  <Route key="expenses" path={AMAI_PATHS.expenses} element={<GastosPage />} />,
  <Route key="export" path={AMAI_PATHS.export} element={<ExportarPage />} />,
  <Route
    key="customers"
    path={AMAI_PATHS.customers}
    element={<TusClientesPage />}
  />,
  <Route
    key="quick-sale"
    path={AMAI_PATHS.quickSale}
    element={<VentaRapidaPage />}
  />,
  <Route key="orders" path={AMAI_PATHS.orders} element={<PedidoListPage />} />,
  <Route
    key="production"
    path={AMAI_PATHS.production}
    element={<ProduccionPage />}
  />,
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

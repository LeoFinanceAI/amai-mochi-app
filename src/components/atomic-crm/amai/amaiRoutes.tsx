import { Route } from "react-router";

import { ComingSoonPage } from "./ComingSoonPage";
import { AMAI_PATHS } from "./paths";

// Shared by the desktop and mobile route trees (an array, because CustomRoutes
// reads its children as <Route> elements).
export const amaiRoutes = [
  <Route
    key="new-order"
    path={AMAI_PATHS.newOrder}
    element={<ComingSoonPage titleKey="amai.navigation.new_order" stage={2} />}
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

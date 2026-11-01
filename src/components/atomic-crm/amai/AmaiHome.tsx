import { Navigate } from "react-router";

import { AMAI_PATHS } from "./paths";

// Home opens the screen Eduardo uses most; Atomic's CRM dashboard is not used.
export const AmaiHome = () => <Navigate to={AMAI_PATHS.newOrder} replace />;

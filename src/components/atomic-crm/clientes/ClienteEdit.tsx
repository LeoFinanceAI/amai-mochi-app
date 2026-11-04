import { EditBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { AmaiPage } from "../amai/AmaiPage";
import { FormToolbar } from "../layout/FormToolbar";
import { ClienteHistorial } from "./ClienteHistorial";
import { ClienteInputs } from "./ClienteInputs";

// The client's history (bought, owed, latest orders) above their data.
// No delete: orders and payments reference clients (ON DELETE RESTRICT), so a
// client who stops buying is switched to inactive instead.
export const ClienteEdit = () => {
  const translate = useTranslate();
  return (
    <EditBase redirect="list" mutationMode="pessimistic">
      <AmaiPage title={translate("amai.clients.edit_title")}>
        <ClienteHistorial />
        <h2 className="text-2xl">{translate("amai.clients.history.data")}</h2>
        <Form>
          <Card>
            <CardContent>
              <ClienteInputs showActivo />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </AmaiPage>
    </EditBase>
  );
};

import { EditBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { CatalogPage } from "../amai/CatalogPage";
import { FormToolbar } from "../layout/FormToolbar";
import { ClienteInputs } from "./ClienteInputs";

// No delete: orders and payments reference clients (ON DELETE RESTRICT), so a
// client who stops buying is switched to inactive instead.
export const ClienteEdit = () => {
  const translate = useTranslate();
  return (
    <EditBase redirect="list" mutationMode="pessimistic">
      <CatalogPage title={translate("amai.clients.edit_title")}>
        <Form>
          <Card>
            <CardContent>
              <ClienteInputs showActivo />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </CatalogPage>
    </EditBase>
  );
};

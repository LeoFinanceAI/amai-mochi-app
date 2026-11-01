import { CreateBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { CatalogPage } from "../amai/CatalogPage";
import { FormToolbar } from "../layout/FormToolbar";
import { ClienteInputs } from "./ClienteInputs";

export const ClienteCreate = () => {
  const translate = useTranslate();
  return (
    <CreateBase redirect="list">
      <CatalogPage title={translate("amai.clients.create_title")}>
        <Form defaultValues={{ tipo: "distribuidor", activo: true }}>
          <Card>
            <CardContent>
              <ClienteInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </CatalogPage>
    </CreateBase>
  );
};

import { CreateBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { AmaiPage } from "../amai/AmaiPage";
import { FormToolbar } from "../layout/FormToolbar";
import { ClienteInputs } from "./ClienteInputs";

export const ClienteCreate = () => {
  const translate = useTranslate();
  return (
    <CreateBase redirect="list">
      <AmaiPage title={translate("amai.clients.create_title")}>
        <Form defaultValues={{ tipo: "distribuidor", activo: true }}>
          <Card>
            <CardContent>
              <ClienteInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </AmaiPage>
    </CreateBase>
  );
};

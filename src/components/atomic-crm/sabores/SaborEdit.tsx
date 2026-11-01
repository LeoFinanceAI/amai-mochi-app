import { EditBase, Form, useNotify, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../layout/FormToolbar";
import { SaborInputs } from "./SaborInputs";
import { AmaiPage } from "../amai/AmaiPage";
import { saborErrorMessage } from "./saborErrors";

// No delete: products reference flavors (ON DELETE RESTRICT), so a flavor is
// retired by switching "Activo" off instead.
export const SaborEdit = () => {
  const translate = useTranslate();
  const notify = useNotify();
  return (
    <EditBase
      redirect="list"
      mutationMode="pessimistic"
      mutationOptions={{
        onError: (error) => notify(saborErrorMessage(error), { type: "error" }),
      }}
    >
      <AmaiPage title={translate("amai.flavors.edit_title")}>
        <Form>
          <Card>
            <CardContent>
              <SaborInputs showActivo />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </AmaiPage>
    </EditBase>
  );
};

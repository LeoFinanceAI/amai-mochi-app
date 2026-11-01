import { CreateBase, Form, useNotify, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../layout/FormToolbar";
import { SaborInputs } from "./SaborInputs";
import { AmaiPage } from "../amai/AmaiPage";
import { saborErrorMessage } from "./saborErrors";

export const SaborCreate = () => {
  const translate = useTranslate();
  const notify = useNotify();
  return (
    <CreateBase
      redirect="list"
      mutationOptions={{
        onError: (error) => notify(saborErrorMessage(error), { type: "error" }),
      }}
    >
      <AmaiPage title={translate("amai.flavors.create_title")}>
        <Form defaultValues={{ activo: true }}>
          <Card>
            <CardContent>
              <SaborInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </AmaiPage>
    </CreateBase>
  );
};

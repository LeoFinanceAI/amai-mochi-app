import { useTranslate } from "ra-core";

import { AmaiPage } from "./AmaiPage";

interface ComingSoonPageProps {
  titleKey: string;
  stage: number;
}

export const ComingSoonPage = ({ titleKey, stage }: ComingSoonPageProps) => {
  const translate = useTranslate();
  return (
    <AmaiPage title={translate(titleKey)}>
      <div className="rounded-xl border bg-card p-6 text-center">
        <h2 className="text-2xl">{translate("amai.coming_soon.title")}</h2>
        <p className="mt-2 text-muted-foreground">
          {translate("amai.coming_soon.body", { stage })}
        </p>
      </div>
    </AmaiPage>
  );
};
